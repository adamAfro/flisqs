import { useState, useContext, createContext } from 'react'

import WideContext from '../deck/context'
import Speech from "./speech"
import Hearing from "./hearing"
import { useMemory } from '../memory'
import { randomIndex, randomFrom, randomWeighted, subindexToIndex } 
    from '../misc'

import Color from "color"
import { stringSimilarity as calcSimilarity }
    from 'string-similarity-js'

import style from "./style.module.css"
import ui from "../style.module.css"

interface Props {
    term: string, def: string, 
    vocal?: boolean, audible?: boolean, defined?: boolean
}

enum InputMode {
    TEXT = 'text',
    VOCAL = 'vocal',
    SELECTION_TEXT = 'selection-text'
}

const Context = createContext({

    term: '',
    termLangCode: '' as string | undefined, 
    defLangCode: '' as string | undefined, 
        
    mode: InputMode.TEXT, setMode: (_:InputMode) => {},
    audible: false, setAudible: (_:boolean) => {},
    defined: false, setDefined: (_:boolean) => {}
})

export default function Exercise(props: Props) {

    const { termLang, defLang, cards } = useContext(WideContext)
    const termLangCode = useMemory()!.languages
        .find(l => l.name === termLang)?.code

    const [audible, setAudible] = useState(props.audible || Math.random() > .5)
    const [defined, setDefined] = useState(props.defined || !audible)
    const [mode, setMode] = useState(randomFrom([
        InputMode.TEXT,
        InputMode.VOCAL,
        InputMode.SELECTION_TEXT
    ]))

    return <Context.Provider value={{

        termLangCode, 
        defLangCode: undefined,

        audible, setAudible,
        defined, setDefined,
        
        mode, setMode,
        
        term: props.term

    }}><p className={style.card}>

        {mode == InputMode.TEXT ? <Text.Interactions/> : null}
        {mode == InputMode.VOCAL ? <Vocal.Interactions/> : null}
        {mode == InputMode.SELECTION_TEXT ? 
            <Selection.Text guesses={Selection.randomGuesses(props.term, cards)}/> : null}

        <textarea disabled={true} className={style.def} value={defined ? props.def : ''}/>

        <span className={style.options}>

            {audible && termLang ? <Speech
                term={props.term} termLang={termLang}
                def={props.def} defLang={defLang}
            /> : null}

        </span>

    </p></Context.Provider>
}

namespace Text {

    export function Interactions() {

        const { term, termLangCode, 
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
                value={answer} lang={termLangCode} spellCheck={false}
                onChange={e => void respond(e.target.value)} 
                style={{ color: color(similarity) }} 
                placeholder='?'/>
        
            <span className={style.interactions}>
    
                {similarity < 1 ? <button onClick={() => {
    
                    if (!defined)
                        return void setDefined(true)
    
                    if (!audible)
                        return void setAudible(true)
    
                    return void respond(hint(answer, term))
    
                }} className={ui.removal}>❔</button> : null}
    
                <button className={ui.primary} onClick={e => {
    
                    respond('')
    
                    const btn = e.target as HTMLButtonElement
                    const input = (btn.parentElement?.previousElementSibling) as HTMLElement
    
                    input.focus()
    
                }}>⌨</button>
    
            </span>    
        </>
    }
    
    function hint(answer: string, term: string) {

        answer = answer.toLocaleLowerCase()
        term = term.toLocaleLowerCase()
    
        const initial = calcSimilarity(answer, term)
        let corrected: string
        
        corrected = correctGuess(answer, term)
        if (calcSimilarity(corrected, term) - initial > 0) 
            return corrected
    
        corrected = addToGuesses(answer, term)
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
    
    function addToGuesses(answer: string, term: string) {
    
        const all = term.split(' ').filter(x => x.trim())
        const provided = answer.split(' ').filter(x => x.trim())
            .filter(x => all.includes(x))
    
        if (provided.length == 0)
            return randomFrom(all)
            
        const indices = Array.from(all.keys()).filter(i => !provided.includes(all[i]))
        const randomIndex = randomFrom(indices)
        const indexToInsert = subindexToIndex(randomIndex, provided, all)
    
        provided.splice(indexToInsert, 0, all[randomIndex])
    
        return provided.join(' ')
    }
}

namespace Vocal {

    export function Interactions() {

        const { term, termLangCode, 
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
                value={answer} lang={termLangCode} spellCheck={false}
                onChange={e => void respond(e.target.value)} 
                style={{ color: color(similarity) }} 
                placeholder='?' disabled/>
        
            <span className={style.interactions}>
    
                {similarity < 1 && (!defined || !audible)  ? <button onClick={() => {
    
                    if (!defined)
                        return void setDefined(true)
    
                    if (!audible)
                        return void setAudible(true)
    
                }} className={ui.removal}>❔</button> : null}
    
                <Hearing className={ui.primary}
                    langCode={termLangCode!} setResult={(heard:string) => respond(heard)}/>
    
            </span>
        
        </>
    }
}

namespace Selection {

    const Context = createContext({
        isCorrect: false, setIsCorrect: (isCorrect:boolean) => {}
    })

    export function Text({ guesses }: { guesses: [string, number][]}) {
    
        const [isCorrect, setIsCorrect] = useState(false)
    
        return <Context.Provider
            value={{ isCorrect, setIsCorrect }}>
    
            <span className={style.selection}>
                {guesses.map(([text, sim], i) => <Option 
                    text={text} sim={sim} key={i}
                />)}
            </span>
    
        </Context.Provider>
    }

    function Option({ text, sim }: { text: string, sim: number }) {
    
        const { isCorrect, setIsCorrect } = useContext(Context)
    
        const [showSim, setShowSim] = useState(false)
    
        return <button disabled={isCorrect && sim != 1} className={ui.primary}
            style={showSim ? {color: color(sim)} : {}} 
            onClick={() => {
                setShowSim(true)
                if (sim == 1)
                    setIsCorrect(true)
            }
        }>{text}</button>
    }

    export function randomGuesses(term: string, cards: { term: string }[]) {
    
        const texts = cards.map(c => c.term).filter(x => x != term)
        const sims = texts.map(t => calcSimilarity(t, term))
    
        const guesses = [] as [string, number][]
        for (let i = 0; i < 3; i++) {
            
            let index = randomWeighted(sims)
            console.log(i, term, index, cards[index]?.term, sims[index])
            if (index == -1)
                index = randomFrom([...sims.keys()])
    
            console.log(i, term, index, cards[index].term, sims[index])
            
            guesses.push([texts[index], sims[index]])
            sims.splice(index, 1)
            texts.splice(index, 1)
        }
    
        guesses.splice(randomIndex(guesses), 0, [term, 1])
    
        return guesses
    }
}

function color(value = 0) {

    return new Color([255, 0, 0])
        .mix(new Color([0, 255, 0]), value == 1 ? value : value * 1 / 2)
        .string()
}