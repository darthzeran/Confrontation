import {
    EVIL_CHARS,
    EVIL_NAMES,
    EVIL_SPECIAL_CARDS,
    GOOD_CHARS,
    GOOD_NAMES,
    GOOD_SPECIAL_CARDS
} from './consts.ts';
import * as Logic from './logic.ts'
import {GState} from './types';


export function aiSetup(G: GState) {
    const aiGood = G.aiId === '1'
    const isHardMode = Math.floor(Math.random() * 10) === 0
    const mode = Logic.getMode(G.matchID)
    if (aiGood) {
        if (mode === 'DRAFT') {
            const op = Logic.shuffle([GOOD_NAMES.BOROMIR, GOOD_NAMES.TREEBEARD])
            const top = Logic.shuffle([isHardMode ? op[1] : GOOD_NAMES.PIPPIN, GOOD_NAMES.VARIANTARAGORN, op[0]])
            G.regions['RHUDAUR'].currentOccupants = [top[0]]
            G.regions['EREGION'].currentOccupants = [top[1]]
            G.regions['ENEDWAITH'].currentOccupants = [top[2]]

            const elf = Logic.shuffle([GOOD_NAMES.LEGOLAS, GOOD_NAMES.ELROND])
            const middle = Logic.shuffle([GOOD_NAMES.MERRY, GOOD_NAMES.VARIANTGANDALF, elf[0]])

            G.regions['ARTHEDAIN'].currentOccupants = [middle[0]]
            G.regions['CARDOLAN'].currentOccupants = [middle[1]]
            G.regions['SHIRE'].currentOccupants = [
                GOOD_NAMES.VARIANTFRODO,
                GOOD_NAMES.VARIANTSAM,
                GOOD_NAMES.GIMLI,
                middle[2],
            ]
        } else if (mode === 'VARIANT') {
            const top = Logic.shuffle([GOOD_NAMES.SMEAGOL, GOOD_NAMES.VARIANTARAGORN, GOOD_NAMES.TREEBEARD])
            G.regions['RHUDAUR'].currentOccupants = [top[0]]
            G.regions['EREGION'].currentOccupants = [top[1]]
            G.regions['ENEDWAITH'].currentOccupants = [top[2]]

            const middle = Logic.shuffle([GOOD_NAMES.FARAMIR, GOOD_NAMES.VARIANTGANDALF, GOOD_NAMES.ELROND])

            G.regions['ARTHEDAIN'].currentOccupants = [middle[0]]
            G.regions['CARDOLAN'].currentOccupants = [middle[1]]
            G.regions['SHIRE'].currentOccupants = [
                GOOD_NAMES.VARIANTFRODO,
                GOOD_NAMES.VARIANTSAM,
                GOOD_NAMES.THEODEN,
                middle[2],
            ]
        } else {
            // classic
            const top = Logic.shuffle([GOOD_NAMES.PIPPIN, GOOD_NAMES.CLASSICARAGORN, GOOD_NAMES.BOROMIR])
            G.regions['RHUDAUR'].currentOccupants = [top[0]]
            G.regions['EREGION'].currentOccupants = [top[1]]
            G.regions['ENEDWAITH'].currentOccupants = [top[2]]

            const middle = Logic.shuffle([GOOD_NAMES.MERRY, GOOD_NAMES.CLASSICGANDALF, GOOD_NAMES.LEGOLAS])

            G.regions['ARTHEDAIN'].currentOccupants = [middle[0]]
            G.regions['CARDOLAN'].currentOccupants = [middle[1]]
            G.regions['SHIRE'].currentOccupants = [
                GOOD_NAMES.CLASSICFRODO,
                GOOD_NAMES.CLASSICSAM,
                GOOD_NAMES.GIMLI,
                middle[2],
            ]
        }

        G.players['1'].charactersToPlace = []
        G.goodCharacterToPlace = null
        const goodTiles = ['RHUDAUR', 'EREGION', 'ENEDWAITH', 'ARTHEDAIN', 'CARDOLAN', 'SHIRE']
        goodTiles.forEach(regName => {
            G.regions[regName].currentOccupants.forEach(charId => {
                G.characters[charId] = GOOD_CHARS[charId]
            })
        })
        G.goodReady = true
        // cards
    } else {
        if (mode === 'DRAFT') {
            const power = Logic.shuffle([EVIL_NAMES.CLASSICSARUMAN, EVIL_NAMES.CLASSICWITCHKING, EVIL_NAMES.CLASSICORCS, EVIL_NAMES.SHELOB, EVIL_NAMES.MOUTH])
            G.regions['MORDOR'].currentOccupants = [
                power[0],
                EVIL_NAMES.WARG,
                power[1],
                power[2],
            ]
            G.regions['DAGORLAD'].currentOccupants = [power[3]]
            G.regions['GONDOR'].currentOccupants = [isHardMode ? EVIL_NAMES.CAVETROLL : EVIL_NAMES.VARIANTFLYINGNAZGUL]
            G.regions['MIRKWOOD'].currentOccupants = [power[4]]
            G.regions['FANGORN'].currentOccupants = [EVIL_NAMES.WATCHER]
            G.regions['ROHAN'].currentOccupants = [EVIL_NAMES.BALROG]
        } else if (mode === 'VARIANT') {
            const power = Logic.shuffle([EVIL_NAMES.VARIANTSARUMAN, EVIL_NAMES.VARIANTWITCHKING, EVIL_NAMES.VARIANTORCS, EVIL_NAMES.WORMTONGUE, EVIL_NAMES.MOUTH])
            G.regions['MORDOR'].currentOccupants = [
                power[0],
                EVIL_NAMES.GOLLUM,
                power[1],
                power[2],
            ]
            G.regions['DAGORLAD'].currentOccupants = [power[3]]
            G.regions['GONDOR'].currentOccupants = [EVIL_NAMES.VARIANTFLYINGNAZGUL]
            G.regions['MIRKWOOD'].currentOccupants = [power[4]]
            G.regions['FANGORN'].currentOccupants = [EVIL_NAMES.WATCHER]
            G.regions['ROHAN'].currentOccupants = [EVIL_NAMES.URUKHAI]
        } else {
            // classic
            const power = Logic.shuffle([EVIL_NAMES.CLASSICSARUMAN, EVIL_NAMES.CLASSICWITCHKING, EVIL_NAMES.CLASSICORCS, EVIL_NAMES.SHELOB, EVIL_NAMES.BLACKRIDER])
            G.regions['MORDOR'].currentOccupants = [
                power[0],
                EVIL_NAMES.WARG,
                power[1],
                power[2],
            ]
            G.regions['DAGORLAD'].currentOccupants = [power[3]]
            G.regions['GONDOR'].currentOccupants = [EVIL_NAMES.CLASSICFLYINGNAZGUL]
            G.regions['MIRKWOOD'].currentOccupants = [power[4]]
            G.regions['FANGORN'].currentOccupants = [EVIL_NAMES.CAVETROLL]
            G.regions['ROHAN'].currentOccupants = [EVIL_NAMES.BALROG]
        }

        G.players['0'].charactersToPlace = []
        G.evilCharacterToPlace = null
        G.evilReady = true
        const evilTiles = ['MORDOR', 'DAGORLAD', 'GONDOR', 'MIRKWOOD', 'FANGORN', 'ROHAN']
        evilTiles.forEach(regName => {
            G.regions[regName].currentOccupants.forEach(charId => {
                G.characters[charId] = EVIL_CHARS[charId]
            })
        })
    }
}

export function aiCardsSetup(G: GState, events: any, type: 'default' | number) {
    G.messages = []
    const cardsPer = type === 'default' ? 2 : Number(type)
    G.players['0'].specialCards = []
    G.players['1'].specialCards = []

    if (cardsPer === 0) {
        Logic.updateHistory(G, 'No Special cards to be used')
        G.chooseSpecials = false
        events.endPhase()
    } else if (cardsPer === 4) {
        Logic.updateHistory(G, 'All Special cards to be used')
        G.players['0'].specialCards = [...EVIL_SPECIAL_CARDS]
        G.players['1'].specialCards = [...GOOD_SPECIAL_CARDS]
        G.chooseSpecials = false
        events.endPhase()
    } else {
        G.specialCardDefault = type === 'default'
        G.specialCardsPer = cardsPer
        G.chooseSpecials = true
        // chose my specials
        if (Logic.isSpecifiedPlayerGood(G.aiId)) {
            G.players['1'].specialCards = [{
                id: 2,
                title: 'Gandalf the White',
                description: 'Revive Defeated Gandalf',
                full: 'This card can be played after the Sauron player has finished his turn. The Fellowship player must skip his entire turn to use this card. When played, the Fellowship player may bring a defeated Gandalf back into play, by placing the Gandalf character in Fangorn. The Fellowship player may not play this card if Fangorn is occupied by any Sauron character, or if two other Fellowship characters are in Fangorn. This card may not be used unless Gandalf has already been defeated',
            }, {
                id: 4,
                title: 'Gwaihir the Windlord',
                description: 'Allow your character to insantly retreat',
                full: 'This card can be played at the beginning of a battle, before character texts are resolved. The Fellowship character gains the ability “Immediately retreat sideways or backwards” (replacing the character’s normal text) for the duration of that battle only. The Fellowship player may not play Gwaihir the Windlord in a battle against the Warg. ',
            }
            ]
        }
        else {
            G.players['0'].specialCards = [{
                id: 6,
                title: 'Recall to Mordor',
                description: 'Return an Evil character to Mordor',
                full: 'This card can be played after the Fellowship player has finished his turn. The Sauron player must skip his entire turn to use this card. When played, the Sauron player may take one of the Sauron characters anywhere on the board and place it back in Mordor. The Sauron player may not do this if Mordor is occupied by any Fellowship characters, or four Sauron characters.',
            }, {
                id: 8,
                title: 'Crebain of Dunland',
                description: 'Permanently reveal a good character',
                full: 'This card can be played after the Fellowship player has finished his turn. The Sauron player must skip his entire turn to use this card. When played, the Sauron player may choose and reveal a Fellowship character. That character must remain revealed for the remainder of the game. If Gandalf is chosen, then later defeated, but returned to play with the “Gandalf the White” Special Card, the new Gandalf is no longer affected by the “Crebain of Dunland”.',
            }
            ]
        }

        events.setActivePlayers({
            all: 'specialCards',
        })
    }
}


export function evilAIMove({G, events, ctx}){
    let charId = G.kingRevealed
    if(!charId){
        // if crebain, use it
        const crebainCard = G.players['0'].specialCards.find(card => card.id === 8)
        if(crebainCard){
            charId = G.regions['SHIRE'].currentOccupants[Logic.shuffle([0, 1, 2, 3])]
            Logic.updateHistory(G, `Crebain now spy upon ${GOOD_CHARS[charId].name}`)

            G.characters[charId].permaReveal = true

            G.players['0'].specialCards = G.players['0'].specialCards.filter(card => card.id !== 8)
            G.evilSpecial = null
            events.endTurn()
            return
        }

        // logic
        // attack mordor closest enemies, else move furthest units first
        // BUILD OUT MORE
    }

    // once char selected, move them
    const moves = Logic.generateMoves({
        G,
        playerID:G.aiId,
        selectedTile: Logic.findCharTile(G, charId),
        selectedChar: Logic.getChar(G, charId)
    })

    //
}
