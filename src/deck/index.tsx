import { useEffect, useState } from 'react'

import { useTranslation } from '../localisation'
import { useMemory } from "../memory"
import { get, modifyCards, remove, addCards, getData } 
    from './database'

import { Scanner, Text as TextInput } from './input'
import * as Card from '../card'
import Editor from './editor'

import { Link, links } from '../app'

import ui from "../style.module.css"
import style from "./style.module.css"

enum State {
    REMOVED,
    LOADING,
    PARTIAL_LOADED,
    LOADED,
    EXERCISES
}

export * from './database'

export { default as Editor } from './editor'

export default function Deck(props: { id?: number }) {

    const { t } = useTranslation()
    const { database } = useMemory()!

    const id = props.id || getIdFromPath()

    const [state, setState] = useState(State.LOADING)
    
    const [name, setName] = useState(undefined as string | undefined)
    const [termLang, setTermLang] = useState(undefined as string | undefined)
    const [defLang, setDefLang] = useState(undefined as string | undefined)
    useEffect(() => void getData(id, database!).then(data => {

        setState(State.PARTIAL_LOADED)
        setName(data.name)
        setTermLang(data.termLang)
        setDefLang(data.defLang)
        
    }), [])

    const [addedCards, setAddedCards] = useState([] as  Card.Data[])
    const [initialCards, setInitialCards] = useState<Card.Data[] | undefined>(undefined)
    useEffect(() => void get(id, database!).then(({ cards }) => {

        if (state != State.PARTIAL_LOADED)
            return

        setInitialCards(orderLoadedCards(cards) as Card.Data[])
        setState(State.LOADED)

    }), [state])

    const [spread, setSpread] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    return <div className={style.deck}>

        {state > State.LOADING ? <Editor 
            deckId={id!} initalName={name!} 
            termLang={termLang!} defLang={defLang!}
            setTermLang={setTermLang} setDefLang={setDefLang}/> : null}

        <section className={style.options}>

            <button data-testid="scan-btn" onClick={() => setScanning(prev => !prev)}>
                {scanning ? t`close scanner` : t`scan QR`}
            </button>

            {scanning ? <Scanner deckId={id} onSuccess={cards => {

                setScanning(false)
                setAddedCards(prev => [
                    ...cards, ...prev
                ])

            }}/> : null}

            {!scanning && showOptions ? <>

                <button className={ui.removal} onClick={() => setShowOptions(false)}>
                    {t`less options`}
                </button>

                <button data-testid="deck-copy-btn" className={style.secondary} onClick={() => {
                        
                    const text = [...addedCards, ...initialCards!]
                        .map(({ term, def }) => `${term} - ${def}`).join('\n')
                    navigator.clipboard.writeText(text)
    
                }}>
                    {t`copy as text`}
                </button>
                
                <TextInput deckId={id} onSuccess={cards => {

                    setScanning(false)
                    setAddedCards(prev => [
                        ...cards, ...prev
                    ])

                }}/>

                <Link to={links.pocket} role='button' className={ui.removal} data-testid="deck-remove-btn" onClick={() => { 
                    
                    remove(id, database!)
                    setState(State.REMOVED)

                }}>{t`remove deck`}</Link>
                
            </>: !scanning ? <button data-testid='more-opt-btn' onClick={() => setShowOptions(true)} className={style.secondary}>
                {t`more options`}
            </button> : null}

        </section>

        <p>
            {(initialCards?.length || 0) + addedCards.length} {t`of cards`}
            <button data-testid="add-card-btn" onClick={() => {

                addCards(id, [{ term: '', def: '' }], database!)
                    .then(ids => setAddedCards([{ 
                        id: Number(ids[0]), term: '', def: '', deckId: id 
                    }, ...addedCards!]))

            }}>{t`add`}</button>
        </p>

        <div className={ui.quickaccess}>

            <div className={ui.faraccess}>
                <p><Link role="button" to={links.pocket}>{t`go back`}</Link></p>
            </div>
            
            <div className={ui.thumbaccess}>

                <button className={state == State.EXERCISES ? style.secondary: ''} onClick={() => {

                    state != State.EXERCISES ? setState(State.EXERCISES) : setState(State.LOADED)

                    setAddedCards([])
                    get(id, database)
                        .then(({ cards }) => setInitialCards(orderLoadedCards(cards) as Card.Data[]))
                    }} data-testid="play-btn">
                    {state != State.EXERCISES ? t`exercises` : t`edition`}
                </button>
                
                <button className={state != State.EXERCISES ? style.secondary: ''} data-testid="shuffle-cards-btn" onClick={() => {

                    const shuffled = initialCards?.map(card => ({ ...card, order: Math.random() }))
                        .sort((a, b) => a.order! - b.order!).reverse()

                    modifyCards(id, shuffled!, database!)
                    setInitialCards(shuffled)

                }}>{t`shuffle`}</button>

                <button className={state != State.EXERCISES ? style.secondary: ''} data-testid="spread-cards-btn" onClick={() => setSpread(x => !x)}>{
                    spread ? t`shrink` : t`spread`
                }</button>
            </div>

        </div>

        <ul className={style.cardlist} 
            data-testid="added-cards"
            data-spread={spread}>

            {addedCards.map(card => <li key={card.id}>
                {state == State.EXERCISES ?
                    <Card.Exercise {...card} 
                        termLang={termLang!} defLang={defLang}/> :
                    
                    <Card.Editor {...card} 
                        termLang={termLang!} defLang={defLang} />
                }
            </li>)}

        </ul>
        
        {state >= State.LOADED ? <ul className={style.cardlist} 
            data-testid='cards'
            data-spread={spread}>

            {initialCards?.map(card => <li key={card.id}>
                {state == State.EXERCISES ?
                    <Card.Exercise {...card} 
                        termLang={termLang!} defLang={defLang}/> :
                    
                    <Card.Editor {...card} 
                        termLang={termLang!} defLang={defLang} />
                }
            </li>)}

        </ul> : null}
        
    </div>
}

function getIdFromPath() {

    const path = window.location.pathname.split('/').pop()
        
    return Number(path?.split('$').pop())
}

function orderLoadedCards(array: any[]) {

    return array.sort((a, b) => a.order! - b.order!).reverse()
}