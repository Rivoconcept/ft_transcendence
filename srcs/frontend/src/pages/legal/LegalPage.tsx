import React from 'react';
import { Link } from 'react-router-dom';
import { PrivacyPolicy, TermsOfService } from '../../components/Rules';

export default function LegalPage(): React.JSX.Element {
	return (
		<section className="legal-page">
			<div className="legal-page__top">
				<Link to="/" className="legal-page__back">
					Back to previous page
				</Link>
			</div>
			<PrivacyPolicy />
			<TermsOfService />
		</section>
	);
}
