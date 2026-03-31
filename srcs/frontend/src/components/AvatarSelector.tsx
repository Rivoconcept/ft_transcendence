import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useRef, useState } from 'react';

interface AvatarSelectorProps {
    value: string | null;
    radius?: number; // Note: represents diameter, not radius
    onChange: (base: string | null) => void;
}

export default function AvatarSelector({ value, radius = 50, onChange }: AvatarSelectorProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Button size proportional to avatar (about 25% of diameter, min 20px, max 32px)
    const buttonSize = Math.min(Math.max(radius * 0.25, 20), 32);
    const iconSize = buttonSize * 0.5;
    // Border width proportional to size
    const borderWidth = Math.max(radius * 0.04, 2);

    const manageFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image')) return;
            const reader = new FileReader();
            reader.onload = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    height: radius,
                    width: radius,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: borderWidth,
                    display: 'inline-block',
                    position: 'relative',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    style={{
                        overflow: 'hidden',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'relative',
                    }}
                >
                    <img
                        src={value || '/img/avatar.png'}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                        alt=""
                    />
                    {/* Delete overlay - appears on hover when there's a value */}
                    {value && isHovered && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(220, 53, 69, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                animation: 'fadeIn 0.2s ease',
                            }}
                            onClick={handleRemove}
                        >
                            <FontAwesomeIcon
                                icon={faXmark}
                                style={{
                                    fontSize: radius * 0.35,
                                    color: 'white',
                                }}
                            />
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInput}
                    onChange={manageFileInput}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
                {/* Camera button positioned on circle edge at 45° (bottom-right) */}
                <button
                    type="button"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '50%',
                        width: buttonSize,
                        height: buttonSize,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'absolute',
                        bottom: '14.65%',
                        right: '14.65%',
                        transform: 'translate(50%, 50%)',
                        padding: 0,
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(50%, 50%) scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(50%, 50%) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.4)';
                    }}
                    onClick={() => fileInput.current?.click()}
                >
                    <FontAwesomeIcon icon={faCamera} style={{ fontSize: iconSize, color: 'white' }} />
                </button>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
