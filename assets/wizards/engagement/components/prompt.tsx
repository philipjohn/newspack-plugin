/* eslint-disable no-nested-ternary */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { BaseControl, CheckboxControl, TextareaControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { Fragment, useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { stringify } from 'qs';

/**
 * Internal dependencies
 */
import {
	Attachment,
	InputField,
	InputValues,
	PromptOptions,
	PromptProps,
	PromptType,
} from './types';
import {
	ActionCard,
	Button,
	Grid,
	ImageUpload,
	Notice,
	TextControl,
	WebPreview,
} from '../../../components/src';

// Note: Schema and types for the `prompt` prop is defined in Newspack Campaigns: https://github.com/Automattic/newspack-popups/blob/master/includes/schemas/class-prompts.php
export default function Prompt( { inFlight, prompt, setInFlight, setPrompts }: PromptProps ) {
	const [ values, setValues ] = useState< InputValues | Record< string, never > >( {} );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ error, setError ] = useState< false | { message: string } >( false );
	const [ success, setSuccess ] = useState< false | string >( false );
	const [ image, setImage ] = useState< null | Attachment >( null );

	useEffect( () => {
		if ( Array.isArray( prompt?.user_input_fields ) ) {
			const fields = { ...values };
			let _isDirty = true;
			prompt.user_input_fields.forEach( ( field: InputField ) => {
				fields[ field.name ] = field.value || field.default;
				if ( field.value ) {
					_isDirty = false; // Allow saving if all values are default.
				}
			} );
			setIsDirty( _isDirty );
			setValues( fields );
		}

		if ( prompt.featured_image_id ) {
			setInFlight( true );
			apiFetch< Attachment >( {
				path: `/wp/v2/media/${ prompt.featured_image_id }`,
			} )
				.then( ( attachment: Attachment ) => {
					if ( attachment?.source_url || attachment?.url ) {
						setImage( { url: attachment.source_url || attachment.url } );
					}
				} )
				.catch( setError )
				.finally( () => {
					setInFlight( false );
				} );
		}
	}, [ prompt ] );

	// Clear success message after a few seconds.
	useEffect( () => {
		setTimeout( () => setSuccess( false ), 5000 );
	}, [ success ] );

	const getPreviewUrl = ( { options, slug }: { options: PromptOptions; slug: string } ) => {
		const { placement, trigger_type: triggerType } = options;
		const previewQueryKeys = window.newspack_engagement_wizard.preview_query_keys;
		const abbreviatedKeys = { preset: slug };
		Object.keys( options ).forEach( ( key: string ) => {
			if ( previewQueryKeys.hasOwnProperty( key ) ) {
				abbreviatedKeys[ previewQueryKeys[ key ] ] = options[ key ];
			}
		} );

		let previewURL = '/';
		if ( 'archives' === placement && window.newspack_engagement_wizard?.preview_archive ) {
			previewURL = window.newspack_engagement_wizard.preview_archive;
		} else if (
			( 'inline' === placement || 'scroll' === triggerType ) &&
			window &&
			window.newspack_engagement_wizard?.preview_post
		) {
			previewURL = window.newspack_engagement_wizard?.preview_post;
		}

		return `${ previewURL }?${ stringify( { ...abbreviatedKeys } ) }`;
	};

	const savePrompt = ( slug: string, data: InputValues ) => {
		return new Promise< void >( ( res, rej ) => {
			setError( false );
			setSuccess( false );
			setInFlight( true );
			apiFetch< [ PromptType ] >( {
				path: '/newspack-popups/v1/reader-activation/campaign',
				method: 'post',
				data: {
					slug,
					data,
				},
			} )
				.then( ( fetchedPrompts: Array< PromptType > ) => {
					setPrompts( fetchedPrompts );
					setSuccess( __( 'Prompt saved.', 'newspack' ) );
					setIsDirty( false );
					res();
				} )
				.catch( err => {
					setError( err );
					rej( err );
				} )
				.finally( () => {
					setInFlight( false );
				} );
		} );
	};

	return (
		<ActionCard
			isMedium
			expandable
			collapse={ prompt.ready }
			title={ prompt.title }
			description={ sprintf(
				// Translators: Status of the prompt.
				__( 'Status: %s', 'newspack' ),
				prompt.ready ? __( 'Ready', 'newspack' ) : __( 'Pending', 'newspack' )
			) }
			checkbox={ prompt.ready ? 'checked' : 'unchecked' }
		>
			{
				<Grid columns={ 2 } gutter={ 16 } className="newspack-ras-campaign__grid">
					<div className="newspack-ras-campaign__fields">
						{ prompt.user_input_fields.map( ( field: InputField ) => (
							<Fragment key={ field.name }>
								{ 'array' === field.type && Array.isArray( field.options ) && (
									<BaseControl
										id={ `newspack-engagement-wizard__${ field.name }` }
										label={ field.label }
									>
										{ field.options.map( option => (
											<BaseControl
												key={ option.id }
												id={ `newspack-engagement-wizard__${ option.id }` }
												className="newspack-checkbox-control"
												help={ option.description }
											>
												<CheckboxControl
													disabled={ inFlight }
													label={ option.label }
													value={ option.id }
													checked={ values[ field.name ]?.indexOf( option.id ) > -1 }
													onChange={ ( value: boolean ) => {
														const toUpdate = { ...values };
														if ( ! value && toUpdate[ field.name ].indexOf( option.id ) > -1 ) {
															toUpdate[ field.name ].value = toUpdate[ field.name ].splice(
																toUpdate[ field.name ].indexOf( option.id ),
																1
															);
															setIsDirty( true );
														}
														if ( value && toUpdate[ field.name ].indexOf( option.id ) === -1 ) {
															toUpdate[ field.name ].push( option.id );
															setIsDirty( true );
														}
														setValues( toUpdate );
													} }
												/>
											</BaseControl>
										) ) }
									</BaseControl>
								) }
								{ 'string' === field.type && field.max_length && 100 < field.max_length && (
									<TextareaControl
										className="newspack-textarea-control"
										label={ field.label }
										disabled={ inFlight }
										help={ `${ values[ field.name ]?.length || 0 } / ${ field.max_length }` }
										onChange={ ( value: string ) => {
											if ( value.length > field.max_length ) {
												return;
											}

											const toUpdate = { ...values };
											toUpdate[ field.name ] = value;
											if ( JSON.stringify( toUpdate ) !== JSON.stringify( values ) ) {
												setIsDirty( true );
											}
											setValues( toUpdate );
										} }
										placeholder={ field.default }
										rows={ 10 }
										value={ values[ field.name ] || '' }
									/>
								) }
								{ 'string' === field.type && field.max_length && 100 >= field.max_length && (
									<TextControl
										label={ field.label }
										disabled={ inFlight }
										help={ `${ values[ field.name ]?.length || 0 } / ${ field.max_length }` }
										onChange={ ( value: string ) => {
											if ( value.length > field.max_length ) {
												return;
											}

											const toUpdate = { ...values };
											toUpdate[ field.name ] = value;
											if ( JSON.stringify( toUpdate ) !== JSON.stringify( values ) ) {
												setIsDirty( true );
											}
											setValues( toUpdate );
										} }
										placeholder={ field.default }
										value={ values[ field.name ] || '' }
									/>
								) }
								{ 'int' === field.type && 'featured_image_id' === field.name && (
									<BaseControl
										id={ `newspack-engagement-wizard__${ field.name }` }
										label={ field.label }
									>
										<ImageUpload
											buttonLabel={ __( 'Choose image', 'newspack' ) }
											disabled={ inFlight }
											image={ image }
											onChange={ ( attachment: Attachment ) => {
												const toUpdate = { ...values };
												toUpdate[ field.name ] = attachment?.id || 0;
												if ( toUpdate[ field.name ] !== values[ field.name ] ) {
													setIsDirty( true );
												}
												setValues( toUpdate );
												if ( attachment?.url ) {
													setImage( attachment );
												} else {
													setImage( null );
												}
											} }
										/>
									</BaseControl>
								) }
							</Fragment>
						) ) }
						{ error && (
							<Notice
								noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
								isError
							/>
						) }
						{ success && <Notice noticeText={ success } isSuccess /> }
						<Button
							isPrimary
							onClick={ () => savePrompt( prompt.slug, values ) }
							disabled={ inFlight }
						>
							{ inFlight
								? __( 'Saving…', 'newspack' )
								: sprintf(
										// Translators: Save or Update settings.
										__( '%s prompt settings', 'newspack' ),
										prompt.ready ? __( 'Update', 'newspack' ) : __( 'Save', 'newspack' )
								  ) }
						</Button>
						<WebPreview
							url={ getPreviewUrl( prompt ) }
							renderButton={ ( { showPreview }: { showPreview: () => void } ) => (
								<Button
									disabled={ inFlight }
									isSecondary
									onClick={ async () => {
										if ( isDirty ) {
											await savePrompt( prompt.slug, values );
										}
										showPreview();
									} }
								>
									{ __( 'Preview prompt', 'newspack' ) }
								</Button>
							) }
						/>
					</div>
				</Grid>
			}
		</ActionCard>
	);
}