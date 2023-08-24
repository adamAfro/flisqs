# FCQR :black_joker:

Flashcards with :camera: QR code scanning

## Features&TODOs

- :flower_playing_cards: decks and cards
    - [x] save multiple sets and let to choose between them
    - [x] decks and cards edition 
    - [x] read words [:loud_sound: aloud](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
    - [x] custom voice setup\*
    - [x] scan words\*
- :brain: exercise mode
    - [x] guessing term based on definition or voice - reponding with voice or text input
    - [ ] hints and correction
- :computer: technical issues
    - [x] act as PWA
    - [ ] make app avaible offline after initial entry
    - [ ] option to update app
- :flags: locations
    - [x] :england: English (base)
    - [x] :poland: Polish
    - [ ] :it: Italian
    - [ ] :fr: French
    - [ ] :es: Spanish

\* need some fixes

## Dev&Deps

- [react JS](https://reactjs.org/)
    - `npm start`
    - `npm test` ([running tests](https://facebook.github.io/create-react-app/docs/running-tests))
        - all t[(j)est](https://jestjs.io/)s' should pass except todo's
    - `npm run build` ([deployment](https://facebook.github.io/create-react-app/docs/deployment))
    - `npm run eject`
- [mebjas/html5-qrcode](https://github.com/mebjas/html5-qrcode) as provided under Apache-2.0 license 
    - testing QR code reader on a mobile requires serving over HTTPS,
        curretly done with VS Code `live server` extension 
        with [self-signed cert.](https://www.akadia.com/services/ssh_test_certificate.html)
        1. `openssl genrsa -des3 -out server.key 1024` - create key
        2. `openssl req -new -key server.key -out server.csr` - request self-sign
        3. `openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt` - certificate
        4. then extension needs to be set up with absolute paths to newly created files
- [pico.css](https://picocss.com/) under MIT license


## QR

QR slideshow is like so:

```ts
{ index: number, total: number, data: string, meta: any }
```

### Data format for QR

For now only CSV with this separators is supported:

```
['—', '-', '\t', '|', ',', ';', ' ']
```

They are either passed in meta of a chunk or the first one from right that is in every line is taken.

### Meta for QR

Example chunk for canonical CSV:

```
{ index: 0, total: 5, data: '...', meta: {
    type: 'CSV', 
    characters: {
        separator: ',',
        endline: '\n'
    }
}}
```