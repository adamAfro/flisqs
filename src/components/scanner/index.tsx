import { useState } from 'react'

import QR from './html5qr'


/**
 * @example
 * // Sender side:
 * showQRDataFrames([ 
 *      { index: 0, total: 2, data: '...' },
 *      { index: 1, total: 2, data: '...' } 
 * ], { milisecondsBetweenFrames: 256, width: 256 })
 *
 * // Receiver's device scans the QR codes  1 by 1
 * import QR from this_file
 * <...>
 *      <QR done={useState([] as any[] | undefined)}
 *          data={useState(false as boolean | undefined)}
 *          meta={useState({} as any)} />
 * </...>
 */
export default (props: {
    setData: ReturnType <typeof useState <any[]> >[1],
    setDone: ReturnType <typeof useState <boolean> >[1],
    setMeta: ReturnType <typeof useState <any> >[1]
}) => {
    
    const indices = [] as number[]
    const 
        [checked, setChecked] = useState([] as number[]), 
        [total, setTotal] = useState(0)

    const onScan = (decodedText = '') => {
        
        let output = JSON.parse(decodedText)
        const isDataChunk = 
            output.data !== undefined &&
            output.index !== undefined &&
            output.total !== undefined
        if (!isDataChunk)
            return
  
        const hasBeenRead = indices.includes(output.index)
        if (hasBeenRead)
            return
        
        indices.push(output.index)
        
        props.setData((prev) => [...prev as any[], output.data as any])
        setTotal(output.total)
        setChecked(indices)

        if (output.meta)
            props.setMeta((prev: any) => ({ ...output.meta, ...prev }))

        if (indices.length == output.total) {
      
            props.setDone(true)
      
            return
        }
    }

    return <div>

        <QR onSuccess={onScan} onError={(e) => console.error(e)}/>
        { checked.toString() + `${checked.length}/${total}` || 0 }

    </div>
}