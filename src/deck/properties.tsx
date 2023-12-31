import { useContext, useEffect, useState } from 'react'

import { Database, Stores } from "../memory"

import { useTranslation } from '../localisation'
import { Data as Language, read as readLanguages } from '../pocket/tags'
import { useMemory } from "../memory"
import { Context, Data } from '.'

import Button from '../button'

import FetchButton from './fetch'

export function Name() {

    const context = useContext(Context)
    const { id } = context

    const { t } = useTranslation()
    const { database } = useMemory()!

    const [name, setName] = useState(context.name)

    return <input value={name} onChange={async (e) => {
        
        setName(e.target.value)
        
        if (!id) return

        const { done, store } = readwrite(database)

        const deck = await store.get(id) as Data

        await store.put({ ...deck, name: e.target.value })        
        return await done
        
    }} placeholder={t`unnamed deck`}/>
}

export function TagSelect() {

    const { database } = useMemory()!

    const { id, tag, setTag } = useContext(Context)

    const [tags, setTags] = useState([] as Language[])
    useEffect(() => void (async function() {

        const { done, store } = readLanguages(database)

        const tags = await store.getAll() as Data[]
        
        await done
        return tags

    })().then(ls => setTags(ls)), [])

    const { t } = useTranslation()

    return <select onChange={async (e) => {

        const tagId = Number(e.target.value)
        const tag = tags
            .find(({ id }) => id == tagId)

        setTag(prev => tag)
        
        const { done, store } = readwrite(database)
        const deck = await store.get(id) as Data
        
        await store.put({ ...deck, tagId })
        return await done
        
    }} value={tag?.id}>
        <option key={-1}>{t`no tag`}</option>
        {tags.map(({ id, name }) => 
            <option key={id} value={id}>{name}</option>)
        }
    </select>
}

export function MuteButton() {

    const { database } = useMemory()!

    const { id, muted, setMuted, tag } = useContext(Context)

    return <Button symbol={muted ? 'SpeakerOff' : 'Speaker'} attention='none' onClick={async () => {

        const { done, store } = readwrite(database)
        const deck = await store.get(id) as Data
        
        await store.put({ ...deck, muted: !muted })
        await done
        
        setMuted(p => !p)
    
    }} disabled={!tag || !tag.code}/>
}

export function SilenceButton() {

    const { database } = useMemory()!

    const { id, silent, setSilent, tag } = useContext(Context)

    return <Button symbol={silent ? 'MicrophoneOff' : 'Microphone'} attention='none' onChange={async () => {

        const { done, store } = readwrite(database)
        const deck = await store.get(id) as Data
        
        await store.put({ ...deck, silent: !silent })
        await done
        
        setSilent(p => !p)
    
    }} disabled={!tag || !tag.code}/>
}

export function Resource() {

    const { database } = useMemory()!

    const { id, resource, setResource } = useContext(Context)

    const { t } = useTranslation()

    return <div>

        <input value={resource} onChange={async (e) => {
        
            setResource(e.target.value)
            
            if (!id) return

            const { done, store } = readwrite(database)

            const deck = await store.get(id) as Data

            await store.put({ ...deck, resource: e.target.value })    
            return await done

        }} placeholder={t`resource`}/>

        {resource.startsWith('http://') || resource.startsWith('https://') ? 
            <FetchButton/> : <Button symbol="ABC" attention='none'/>
        }

    </div>   
}

export function readwrite(db: Database) {

    const t = db.transaction(Stores.DECKS, 'readwrite')
    return { done: t.done, store: t.objectStore(Stores.DECKS) }
}

export function read(db: Database) {

    const t = db.transaction(Stores.DECKS, 'readonly')
    return { done: t.done, store: t.objectStore(Stores.DECKS) }
}