import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
	{
		heading: 'Play our Card Game',
		description:
			'Test your Luck and others\' in a mesmerezing card game where you draw cards to reach a score of 27. Against friends, against yourself, or against the house, every game is your chance to prove you were born under the shiniest star. Will you hit 27 or go bust? The choice is yours!',
		imageSrc: '/card.png',
		imageAlt: 'Card game symbol',
	},
	{
		heading: 'Discover King of Diamond',
		description:
			'Inspired by Alice in Borderland, King of Diamond is a whimsical game where you try to outplay your opponent and twist the numbers in your favor. With simple rules but deep strategy, it\'s a game of wits and cunning. Will you be the one to claim the crown?',	
		imageSrc: '/crown.png',
		imageAlt: 'Crown symbol',
	},
	{
		heading: 'Chat with friends',
		description:
			'Create conversations, stay connected after matches, and build your own circle on GameHub. You can meet new players, add them as friends, and keep chatting anytime.',
		imageSrc: '/bubbles.png',
		imageAlt: 'Chat bubbles symbol',
	},
];

export default function LandingPage(): React.JSX.Element {
	return (
		<section className="landing-page">
			<div className="landing-hero">
				<p className="landing-kicker">GameHub</p>
				<h1>Welcome to our Gamehub!</h1>
				<p className="landing-description">
					GameHub is a social gaming space where you can jump into games, meet new people,
					build friendships, and keep the conversation going through live chat.
				</p>
				<div className="landing-actions">
					<Link to="/auth" className="landing-button landing-button--primary">
						Get Started
					</Link>
				</div>
			</div>

			<div className="landing-sections">
				{sections.map((section) => (
					<article key={section.heading} className="landing-feature">
						<div className="landing-feature__text">
							<h2>{section.heading}</h2>
							<p>{section.description}</p>
						</div>
						<img className="landing-feature__image" src={section.imageSrc} alt={section.imageAlt} loading="lazy" />
					</article>
				))}
			</div>

			<footer className="landing-footer">
				<Link to="/legal" className="landing-legal-link">
					See our Privacy Policy & Terms of Services
				</Link>
			</footer>
		</section>
	);
}
