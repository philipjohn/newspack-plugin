/* globals newspack_memberships_gate */
/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Fragment, useEffect } from '@wordpress/element';
import { Button, TextControl, CheckboxControl, SelectControl } from '@wordpress/components';
import { PluginDocumentSettingPanel, PluginPostStatusInfo } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PositionControl from '../components/src/position-control';
import './editor.scss';

const styles = [
	{ value: 'inline', label: __( 'Inline', 'newspack' ) },
	{ value: 'overlay', label: __( 'Overlay', 'newspack' ) },
];

const overlayPositionsLabels = {
	center: __( 'center', 'newspack' ),
	bottom: __( 'bottom', 'newspack' ),
};

const overlaySizes = [
	{ value: 'x-small', label: __( 'Extra Small', 'newspack' ) },
	{ value: 'small', label: __( 'Small', 'newspack' ) },
	{ value: 'medium', label: __( 'Medium', 'newspack' ) },
	{ value: 'large', label: __( 'Large', 'newspack' ) },
	{ value: 'full-width', label: __( 'Full Width', 'newspack' ) },
];

function GateEdit() {
	const { meta } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		return {
			meta: getEditedPostAttribute( 'meta' ),
		};
	} );
	const { editPost } = useDispatch( 'core/editor' );
	useEffect( () => {
		const wrapper = document.querySelector( '.editor-styles-wrapper' );
		if ( ! wrapper ) {
			return;
		}
		if ( meta.style === 'overlay' ) {
			wrapper.setAttribute( 'data-overlay-size', meta.overlay_size );
		} else {
			wrapper.removeAttribute( 'data-overlay-size' );
		}
	}, [ meta.style, meta.overlay_size ] );
	return (
		<Fragment>
			{ newspack_memberships_gate.has_campaigns && (
				<PluginPostStatusInfo>
					<p>
						{ __(
							"Newspack Campaign prompts won't be displayed when rendering gated content.",
							'newspack'
						) }
					</p>
				</PluginPostStatusInfo>
			) }
			<PluginDocumentSettingPanel
				name="memberships-gate-styles-panel"
				title={ __( 'Styles', 'newspack' ) }
			>
				<div className="newspack-memberships-gate-style-selector">
					{ styles.map( style => (
						<Button
							key={ style.value }
							variant={ meta.style === style.value ? 'primary' : 'secondary' }
							isPressed={ meta.style === style.value }
							onClick={ () => editPost( { meta: { style: style.value } } ) }
							aria-current={ meta.style === style.value }
						>
							{ style.label }
						</Button>
					) ) }
				</div>
				{ meta.style === 'inline' && (
					<CheckboxControl
						label={ __( 'Apply fade to last paragraph', 'newspack' ) }
						checked={ meta.inline_fade }
						onChange={ value => editPost( { meta: { inline_fade: value } } ) }
						help={ __(
							'Whether to apply a gradient fade effect before rendering the gate.',
							'newspack'
						) }
					/>
				) }
				{ meta.style === 'overlay' && (
					<Fragment>
						<SelectControl
							label={ __( 'Size', 'newspack' ) }
							value={ meta.overlay_size }
							options={ overlaySizes }
							onChange={ value => editPost( { meta: { overlay_size: value } } ) }
						/>
						<PositionControl
							label={ __( 'Position', 'newspack' ) }
							value={ meta.overlay_position }
							size={ meta.overlay_size }
							allowedPositions={ [ 'bottom', 'center' ] }
							onChange={ value => editPost( { meta: { overlay_position: value } } ) }
							help={ sprintf(
								// translators: %s is the placement of the gate.
								__( 'The gate will be displayed at the %s of the screen.', 'newspack' ),
								overlayPositionsLabels[ meta.overlay_position ]
							) }
						/>
					</Fragment>
				) }
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel
				name="memberships-gate-settings-panel"
				title={ __( 'Settings', 'newspack' ) }
			>
				<TextControl
					type="number"
					value={ meta.visible_paragraphs }
					label={ __( 'Default paragraph count', 'newspack' ) }
					onChange={ value => editPost( { meta: { visible_paragraphs: value } } ) }
					help={ __(
						'Number of paragraphs that readers can see above the content gate.',
						'newspack'
					) }
				/>
				<hr />
				<CheckboxControl
					label={ __( 'Use “More” tag to manually place content gate', 'newspack' ) }
					checked={ meta.use_more_tag }
					onChange={ value => editPost( { meta: { use_more_tag: value } } ) }
					help={ __(
						'Override the default paragraph count on pages where a “More” block has been placed.',
						'newspack'
					) }
				/>
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel
				name="memberships-gate-metering-panel"
				title={ __( 'Metering', 'newspack' ) }
			>
				<CheckboxControl
					label={ __( 'Enable metering', 'newspack' ) }
					checked={ meta.metered }
					onChange={ value => editPost( { meta: { metered: value } } ) }
					help={ __(
						'Limit the number of times a reader can view the gated content.',
						'newspack'
					) }
				/>
				{ meta.metered && (
					<Fragment>
						<CheckboxControl
							label={ __( 'Limit to registered users', 'newspack' ) }
							checked={ meta.metered_registered_only }
							onChange={ value => editPost( { meta: { metered_registered_only: value } } ) }
							help={ __( 'Limit the number of views to registered users only.', 'newspack' ) }
						/>

						<TextControl
							type="number"
							value={ meta.metered_count }
							label={ __( 'Number of views', 'newspack' ) }
							onChange={ value => editPost( { meta: { metered_count: value } } ) }
							help={ __( 'Number of times a reader can view the gated content.', 'newspack' ) }
						/>
						{ ! meta.metered_registered_only && (
							<TextControl
								type="number"
								value={ meta.metered_registered_count }
								label={ __( 'Additional views for registered users', 'newspack' ) }
								onChange={ value => editPost( { meta: { metered_registered_count: value } } ) }
								help={ __(
									'Number of additional times a registered reader can view the gated content.',
									'newspack'
								) }
							/>
						) }
						<SelectControl
							label={ __( 'Time period', 'newspack' ) }
							value={ meta.metered_period }
							options={ [
								{ value: 'day', label: __( 'Day', 'newspack' ) },
								{ value: 'week', label: __( 'Week', 'newspack' ) },
								{ value: 'month', label: __( 'Month', 'newspack' ) },
								{ value: 'year', label: __( 'Year', 'newspack' ) },
							] }
							onChange={ value => editPost( { meta: { metered_period: value } } ) }
							help={ __(
								'The time period during which the metered views will be counted.',
								'newspack'
							) }
						/>
					</Fragment>
				) }
			</PluginDocumentSettingPanel>
		</Fragment>
	);
}

registerPlugin( 'newspack-memberships-gate', {
	render: GateEdit,
	icon: null,
} );
