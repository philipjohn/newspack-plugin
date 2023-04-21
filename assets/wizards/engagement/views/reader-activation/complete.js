/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Button,
	SectionHeader,
	withWizardScreen,
	Card,
	ProgressBar,
	StepsList,
} from '../../../../components/src';
import './style.scss';

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	//const [ error, setError ] = useState( false );
	//const [ prompts, setPrompts ] = useState( null );
	//const [ allReady, setAllReady ] = useState( false );

	const listItems = [
		__(
			'Your <strong>current segments and prompts</strong> will be deactivated and archived.',
			'newspack'
		),
		__(
			'<strong>Reader registration</strong> will be activated to enable better targeting for driving engagement and conversations.',
			'newspack'
		),
		__(
			'The <strong>Reader Activation campaign</strong> will be activated with default segments and settings.',
			'newspack'
		),
	];

	return (
		<div className="newspack-ras-campaign__completed">
			<SectionHeader
				title={ __( 'Enable Reader Activation', 'newspack' ) }
				description={ () => (
					<>
						{ __(
							'An easy way to let your readers register for your site, sign up for newsletters, or become donors and paid members. ',
							'newspack'
						) }

						{ /** TODO: Update this URL with the real one once the docs are ready. */ }
						<ExternalLink href={ 'https://help.newspack.com' }>
							{ __( 'Learn more', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				) }
			/>

			<Card className="newspack-ras-campaign__completed-card">
				<h2>{ __( "You're all set to enable Reader Activation!", 'newspack' ) }</h2>
				<p>{ __( 'This is what will happen next:', 'newspack' ) }</p>

				<Card noBorder className="justify-center">
					<StepsList stepsListItems={ listItems } narrowList />
				</Card>

				<Card buttonsCard noBorder className="justify-center">
					<Button isPrimary onClick={ () => console.log( 'activating RAS' ) }>
						{ __( 'Enable Reader Activation', 'newspack ' ) }
					</Button>
				</Card>
			</Card>
			<Card className="newspack-ras-campaign__completed-card">
				<ProgressBar
					completed="3"
					displayFraction={ false }
					total="8"
					label={ __( 'Deactivating existing prompts and segments…', 'newspack' ) }
				/>
			</Card>
			<div className="newspack-buttons-card">
				<Button
					isSecondary
					disabled={ inFlight }
					href="/wp-admin/admin.php?page=newspack-engagement-wizard#/reader-activation/campaign"
				>
					{ __( 'Back', 'newspack' ) }
				</Button>
			</div>
		</div>
	);
} );
