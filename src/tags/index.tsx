import { useEffect, useState, useContext } from 'react';
import { createContext } from 'react'

import { Database, Stores } from '../memory'
import { useTranslation } from '../localisation'
import { getVoices } from '../speech'
import { useMemory } from '../memory'
import { readwrite, default as Inputs } from './entry'
import { Context as PocketContext } from '../pocket'

import { Button, Widget } from '../interactions'

import style from './style.module.css'

export interface Data {
    id?: number,
    name: string,
    voice?: string,
	code?: string
}

export enum Status { LOADING, FAILED, LOADED }
export const Context = createContext({
    status: Status.LOADING,
    voices: [] as SpeechSynthesisVoice[],
    tags: [] as Data[],
        setTags: (x: (prev: Data[]) => any[]) => {}
})

export default function Languages() {

    const { database } = useMemory()!
    
    const [status, setStatus] = useState(Status.LOADING)
    const [tags, setTags] = useState <Data[]> ([])

    useEffect(() => void (async function() {
        
        const { done, store } = read(database)

        const decks = await store.getAll() as Data[]

        await done
        return decks

    })().then(setTags), [])

    const [voices, setVoices] = useState([] as SpeechSynthesisVoice[])
    useEffect(() => {

        const voicesLoad = getVoices()
            .then(v => void setVoices(v))
            .then(_ => void setStatus(Status.LOADED))

        voicesLoad.catch(e => void setStatus(Status.FAILED))

    }, [])

    const { t } = useTranslation()

    return <Context.Provider value={{ status, voices, 
        tags, setTags
    }}>

        <ul className='row'>
            <li>
                <h2 className={style.heading}>{t`tags`}</h2>
            </li>
            <li>
                <ShowAllButton/>
            </li>{tags.map((language) =>
            <li data-testid={`language-${language.id}`} key={language.id}>
                <Inputs {...language}/>
            </li>)}
            <li>
                <AddButton/>
            </li>
        </ul>

    </Context.Provider>
}

function ShowAllButton() {

    const { activeTagId, setActiveTagId } = useContext(PocketContext)

    const { t } = useTranslation()

    return <Button contents={t`show all`} 
        active={activeTagId == -1} attention='weak'
        onClick={() => setActiveTagId(-1)}/>
}

function AddButton() {

    const { database } = useMemory()!

    const { setTags } = useContext(Context)

    const { t } = useTranslation()

    return <Widget symbol='Plus' onClick={async () => {

        const added = {
            name: t`new language`,
            voice: undefined as string | undefined,
            code: undefined
        }

        const { done, store } = readwrite(database)

        const id = await store.add(added)

        setTags(prev => [...prev, {...added, id}])
        
        await done
        
    }}/>
}

export function read(db: Database) {

    const t = db.transaction(Stores.TAGS, 'readonly')
    return { done: t.done, store: t.objectStore(Stores.TAGS) }
}