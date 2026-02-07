import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCamera} from '@fortawesome/free-solid-svg-icons'
import { useRef } from 'react';

export default function AvatarSelector({value, radius = 50, onChange}: {value: null|string, radius?: number, onChange: (base: string) => void}) {
    const containerStyle = {
        height: radius,
        width: radius,
        borderRadius: '50%',
        border: "black solid 1px",
        display: 'inline-block',
        align: 'center',
    };
    const fileInput = useRef<HTMLInputElement>(null);
    const manageFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (!file.type.startsWith('image'))
                return ;
            console.log('Files', file);
            const reader = new FileReader();
            reader.onload = () => {
                onChange(reader.result as string);
            }
            reader.readAsDataURL(file);
        }
    };
    return (
        <div style={{textAlign: 'center'}}>
            <div style={{...containerStyle, position: 'relative'}}>
                <div style={{overflow: 'hidden', width: '100%', height: '100%', borderRadius: '50%'}}>
                    <img src={value || '/img/default-profile.webp'} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} alt="" />
                </div>
                <input type="file" ref={fileInput} onChange={manageFileInput} style={{display: 'none'}} />
                <button style={{
                    background: "white",
                    border: "1px solid black",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: 'absolute',
                    bottom: '50%',
                    right: 0,
                    transform: 'translate(50%,50%)'
                }}
                onClick={() => fileInput.current?.click()}>
                    <FontAwesomeIcon icon={faCamera} style={{fontSize: 12}} />
                </button>
            </div>
        </div>
    )
}