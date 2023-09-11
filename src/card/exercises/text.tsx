import { useState, useContext } from 'react'

import { Context as DeckContext } from '../../deck'

import { Context, Speech, color } from '../'
import { randomFrom, indexToSubindex, randomSubstring } from '../../misc'

import { stringSimilarity as calcSimilarity }
    from 'string-similarity-js'


import style from "../style.module.css"
import ui from "../../style.module.css"


export default function Text() {

    const { language } = useContext(DeckContext)

    const { 
        term,
        audible, setAudible, 
        defined, setDefined 
    } = useContext(Context)

    const [answer, setAnswer] = useState('')
    const [similarity, setSimilarity] = useState(0)
    function respond(value: string) {

        const sim = calcSimilarity(value, term)

        setAnswer(value)
        setSimilarity(sim)
        if (sim == 1) {
            setAudible(true)
            setDefined(true)
            setAnswer(term)
        }
    }

    return <>

        <input className={style.term} data-is-long={term.length > 15}
            value={answer} lang={language?.code} spellCheck={false}
            onChange={e => void respond(e.target.value)} 
            style={{ color: color(similarity) }} 
            placeholder='?'/>
    
        <span className={style.interactions}>

            {similarity < 1 ? <button onClick={() => {

                if (!defined)
                    return void setDefined(true)

                if (!audible)
                    return void setAudible(true)

                return void respond(hint(answer, term, { substring: true }))

            }} className={ui.removal}>❔</button> : null}

            {audible ? <Speech term={term}/> : null} 

            <button className={ui.primary} onClick={e => {

                respond('')

                const btn = e.target as HTMLButtonElement
                const input = (btn.parentElement?.previousElementSibling) as HTMLElement

                input.focus()

            }}>⌨</button>

        </span>
    </>
}

function hint(answer: string, term: string, { substring = false } = {}) {

    answer = answer.toLocaleLowerCase()
    term = term.toLocaleLowerCase()

    const initial = calcSimilarity(answer, term)
    let corrected: string
    
    corrected = correctGuess(answer, term)
    if (calcSimilarity(corrected, term) - initial > 0) 
        return corrected

    corrected = addToGuesses(answer, term, substring)
    if (calcSimilarity(corrected, term) - initial > 0)
        return corrected

    return term
}

function correctGuess(answer: string, term: string) {

    const corrects = term.split(' ').filter(x => x.trim())
    const guesses = answer.split(' ').filter(x => x.trim())
    
    for (let i = 0; i < guesses.length; i++) {

        if (corrects.includes(guesses[i]))
            continue

        const sims = corrects.map(x => calcSimilarity(guesses[i], x))
        const m = Math.max(...sims)
        if (m == 0)
            continue

        const correct = corrects[sims.findIndex(s => s == m)]
        guesses.splice(i, 1, correct)
        
        return guesses.join(' ')
    }

    return ''
}

function addToGuesses(answer: string, term: string, substring = false) {

    const all = term.split(' ').filter(x => x.trim())
    const provided = answer.split(' ').filter(x => x.trim())
        .filter(x => all.includes(x))

    if (provided.length > 0) return substring ? 
        randomSubstring(randomFrom(all)) : 
        randomFrom(all)
        
    const indices = Array.from(all.keys()).filter(i => !provided.includes(all[i]))
    const guessIndex = randomFrom(indices)
    const indexToInsert = indexToSubindex(guessIndex, provided, all)
    
    const guess = substring ? 
        randomSubstring(all[guessIndex]) : 
        all[guessIndex]
    
    provided.splice(indexToInsert, 0, guess)

    return provided.join(' ')
}