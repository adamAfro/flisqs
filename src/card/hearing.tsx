import { useState, ButtonHTMLAttributes } from 'react'
import { Dispatch, SetStateAction } from 'react'

import { useMemory } from '../memory'
import { useTranslation } from 'react-i18next'

import { listen, Recognition } from "../languages"

export default function Hearing({
    lang, setResult, ...attrs
}: { 
	lang: string, 
    setResult: (x:string) => void 
} & ButtonHTMLAttributes<HTMLButtonElement>) {

	const { t } = useTranslation()
	const [listening, setListening] = useState(false)
    const { languages } = useMemory()!

	return <button onClick={!listening ? () => {
        
        setListening(true)
        listen(alts => setResult(alts[0].trim()), { 
            langCode: languages.find(l => l.name === lang)?.code || lang 
        })

    } : () => setListening(false)} {...attrs}>🎤</button>
}