/* globals newspack_metered_settings */

const STORAGE_KEY = 'newspack_metered';

const settings = newspack_metered_settings;
const storage = window.localStorage;
let locked = false;

function getCurrentExpirationPeriodTime() {
	const date = new Date();
	// Reset time to 00:00:00:000.
	date.setHours( 0 );
	date.setMinutes( 0 );
	date.setSeconds( 0 );
	date.setMilliseconds( 0 );
	switch ( settings.period ) {
		case 'day':
			date.setDate( date.getDate() + 1 );
			break;
		case 'week':
			const day = date.getDay();
			const daysToSaturday = 6 - day;
			date.setDate( date.getDate() + daysToSaturday );
			break;
		case 'month':
			date.setMonth( date.getMonth() + 1 );
			date.setDate( 1 );
			break;
		case 'year':
			date.setFullYear( date.getFullYear() + 1 );
			date.setMonth( 0 );
			date.setDate( 1 );
			break;
	}
	return parseInt( date.getTime() / 1000, 10 );
}

function lockContent() {
	const content = document.querySelector( '.entry-content' );
	if ( ! content ) {
		return;
	}
	const visibleParagraphs = settings.visible_paragraphs;
	const articleElements = document.querySelectorAll( '.entry-content > *' );
	const moreIndex = content.innerHTML.indexOf( '<!--more-->' );
	const gate = content.querySelector( '.newspack-memberships__gate' );
	if ( moreIndex > -1 && settings.use_more_tag ) {
		content.innerHTML = content.innerHTML.substring( 0, moreIndex );
		if ( gate ) {
			content.appendChild( gate );
		}
	} else {
		let paragraphIndex = 0;
		articleElements.forEach( element => {
			if ( element.tagName === 'P' ) {
				paragraphIndex++;
			}
			if ( element.classList.contains( 'newspack-memberships__gate' ) ) {
				return;
			}
			if ( paragraphIndex > visibleParagraphs ) {
				content.removeChild( element );
			}
		} );
	}
}

const data = JSON.parse( storage.getItem( STORAGE_KEY ) ) || {
	content: [],
	expiration: getCurrentExpirationPeriodTime(),
};

// Clear content on expiration period reset.
if ( parseInt( data.expiration, 10 ) < getCurrentExpirationPeriodTime() ) {
	data.expiration = getCurrentExpirationPeriodTime();
	data.content = [];
	storage.setItem( STORAGE_KEY, JSON.stringify( data ) );
}

// Lock content if reached limit, remove gate content if not.
if ( settings.count <= data.content.length && ! data.content.includes( settings.post_id ) ) {
	lockContent();
	locked = true;
} else {
	const gates = document.querySelectorAll( '.newspack-memberships__gate' );
	gates.forEach( gate => {
		gate.parentNode.removeChild( gate );
	} );
}

// Add current content to read content.
if ( ! locked && ! data.content.includes( settings.post_id ) ) {
	data.content.push( settings.post_id );
	storage.setItem( STORAGE_KEY, JSON.stringify( data ) );
}
