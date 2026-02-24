export type Location = {
    title: string,
    description: string,
    id: number,
    maxChars: number,
    directions: {
        UP: string[],
        DOWN: string[],
        SIDEWAYS: string[],
        SPECIAL?: string[],
    },
    currentOccupants: string[],
}

export type BattleCard = StrengthCard | TextCard
export type StrengthCard = {
    id: number,
    type: string,
    value: number,
    discarded?: boolean,
    title?: null,
}
export type TextCard = {
    id: number,
    title: string,
    description: string,
    full: string,
    type: string,
    discarded?: boolean,
    value?: null,
}

export type SpecialCard = {
    id: number,
    title: string,
    description: string,
    full: string,
}

export type Character = {
    name: string,
    id: string,
    value: number,
    description: string,
    reveal?: boolean,
    defeated?: boolean,
    tired?: boolean,
    permaReveal?: boolean,
    permaDefeated?: boolean,
    white?: boolean,
    classic: boolean,
}

export type CharacterMap = Record<string, Character>

export type GState = {
    badState?: string,
    history: string[],
    messages: string[],
    players: {
        0: {
            side: string,
            cards: BattleCard[],
            charactersToPlace: Character[],
            ambush: boolean,
            specialCards: SpecialCard[],
        },
        1: {
            side: string,
            cards: BattleCard[],
            charactersToPlace: Character[],
            specialCards: SpecialCard[],
        },
    },
    regions: Record<string, Location>,
    characters: CharacterMap,

    // placement
    goodCharacterToPlace?: string,
    evilCharacterToPlace?: string,
    stopPlacementWarning?: boolean,
    goodReady?: boolean
    evilReady?: boolean

    // special cards
    chooseSpecials?: boolean,
    specialCardDefault?: boolean,
    specialCardsPer?: number,
    palantirNames?: string[],
    palantirRegions?: string[],
    goodSpecial?: string,
    evilSpecial?: string,
    goodLightMode?: boolean | string,
    mordorDarkMode?: boolean | string,
    kingRevealed?: boolean | string,

    // fight vars
    startingTile?: string,
    attackedTile?: string,
    attackingChar?: string,
    defendingChar?: string,
    battle: Record<string, string>,
    lastPlayerId?: string,

    // ability vars
    goodActions?: string[],
    // change to evil actions?
    badActions?: string[],
    validMoves?: string[],
    grimaCallback?: string,
    swapOptions?: string[],
    aragornSkip?: boolean,
    oldGoodCard?: BattleCard,

    // cards
    goodCard?: BattleCard,
    evilCard?: BattleCard,
    goodPlayMagic?: boolean,
    evilPlayMagic?: boolean,
    goodCardLocked?: boolean,
    evilCardLocked?: boolean,
}
