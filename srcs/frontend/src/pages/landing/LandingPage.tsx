import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
	{
		heading: 'Play our Card Game !',
		description:
			'Draw 3 cards, add their values, and aim for the best Mod-9 score. In multiplayer, the top score wins the round, and in solo mode you push for a total score target to win.',
		imageStack: ['/1.png', '/2.png', '/3.png'],
		imageAlt: 'Card game cards illustration',
	},
	{
		heading: 'Discover King of Diamond',
		description:
			'Start with 10 points, choose a number from 0 to 100 each round, and get as close as possible to 80% of the group average. Every wrong pick costs points until one player stands as the King.',
		imageSrc: '/KoD.png',
		imageAlt: 'King of Diamond illustration',
	},
	{
		heading: 'Chat with friends',
		description:
			'Create conversations, stay connected after matches, and build your own circle on GameHub. You can meet new players, add them as friends, and keep chatting anytime.',
		imageSrc: '/Chat.png',
		imageAlt: 'Chat with friends illustration',
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
						<div className={`landing-feature__image ${section.imageStack ? 'landing-feature__image--cards' : ''}`}>
							{section.imageStack ? (
								<div className="landing-card-cascade">
									{section.imageStack.map((src, idx) => (
										<img
											key={src}
											src={src}
											alt={`${section.imageAlt} ${idx + 1}`}
											className={`landing-card-cascade__item landing-card-cascade__item--${idx + 1}`}
											loading="lazy"
										/>
									))}
								</div>
							) : (
								<img src={section.imageSrc} alt={section.imageAlt} loading="lazy" />
							)}
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
