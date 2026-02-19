import {BattleCard, CharacterMap, Location, SpecialCard} from './types';

export const GOOD_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
export const BAD_INDEXES = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]


export const LOCATIONS: Record<string, Location> = {
    MORDOR: {
        title: 'MORDOR',
        description: 'MORDOR',
        id: 0,
        maxChars: 4,
        directions: {
            UP: [],
            DOWN: ['GONDOR', 'DAGORLAD'],
            SIDEWAYS: [],
        },
        currentOccupants: [],
    },
    DAGORLAD: {
        title: 'DAGORLAD',
        description: 'DAGORLAD',
        id: 1,
        maxChars: 2,
        directions: {
            UP: ['MORDOR'],
            DOWN: ['FANGORN', 'MIRKWOOD'],
            SIDEWAYS: ['GONDOR'],
        },
        currentOccupants: [],
    },
    GONDOR: {
        title: 'GONDOR',
        description: 'GONDOR',
        maxChars: 2,
        id: 2,
        directions: {
            UP: ['MORDOR'],
            DOWN: ['FANGORN', 'ROHAN'],
            SIDEWAYS: ['DAGORLAD'],
        },
        currentOccupants: [],
    },
    MIRKWOOD: {
        title: 'MIRKWOOD',
        description: 'MIRKWOOD',
        id: 3,
        maxChars: 2,
        directions: {
            SPECIAL: ['FANGORN'],
            UP: ['DAGORLAD'],
            DOWN: ['HIGHPASS', 'MISTYMOUNTAINS'],
            SIDEWAYS: ['FANGORN'],
        },
        currentOccupants: [],
    },
    FANGORN: {
        title: 'FANGORN',
        description: 'FANGORN',
        id: 4,
        maxChars: 2,
        directions: {
            SPECIAL: ['ROHAN'],
            UP: ['GONDOR', 'DAGORLAD'],
            DOWN: ['MISTYMOUNTAINS', 'CARADHRAS'],
            SIDEWAYS: ['MIRKWOOD', 'ROHAN'],
        },
        currentOccupants: [],
    },
    ROHAN: {
        title: 'ROHAN',
        description: 'ROHAN',
        id: 5,
        maxChars: 2,
        directions: {
            UP: ['GONDOR'],
            DOWN: ['CARADHRAS', 'GAPROHAN'],
            SIDEWAYS: ['FANGORN'],
        },
        currentOccupants: [],
    },
    HIGHPASS: {
        title: 'HIGHPASS',
        description: 'The High Pass',
        id: 6,
        maxChars: 1,
        directions: {
            UP: ['MIRKWOOD'],
            DOWN: ['RHUDAUR'],
            SIDEWAYS: [],
        },
        currentOccupants: [],
    },
    MISTYMOUNTAINS: {
        title: 'MISTYMOUNTAINS',
        description: 'MISTY MOUNTAINS',
        id: 7,
        maxChars: 1,
        directions: {
            UP: ['MIRKWOOD', 'FANGORN'],
            DOWN: ['RHUDAUR', 'EREGION'],
            SIDEWAYS: [],
        },
        currentOccupants: [],
    },
    CARADHRAS: {
        title: 'CARADHRAS',
        description: 'CARADHRAS',
        id: 8,
        maxChars: 1,
        directions: {
            UP: ['FANGORN', 'ROHAN'],
            DOWN: ['EREGION', 'ENEDWAITH'],
            SIDEWAYS: [],
        },
        currentOccupants: [],
    },
    GAPROHAN: {
        title: 'GAPROHAN',
        description: 'Gap Of Rohan',
        id: 9,
        maxChars: 1,
        directions: {
            UP: ['ROHAN'],
            DOWN: ['ENEDWAITH'],
            SIDEWAYS: [],
        },
        currentOccupants: [],
    },
    RHUDAUR: {
        title: 'RHUDAUR',
        description: 'RHUDAUR',
        id: 10,
        maxChars: 2,
        directions: {
            UP: ['HIGHPASS', 'MISTYMOUNTAINS'],
            DOWN: ['ARTHEDAIN'],
            SIDEWAYS: ['EREGION'],
        },
        currentOccupants: [],
    },
    EREGION: {
        title: 'EREGION',
        description: 'EREGION',
        id: 11,
        maxChars: 2,
        directions: {
            SPECIAL: ['FANGORN'],
            UP: ['MISTYMOUNTAINS', 'CARADHRAS',],
            DOWN: ['ARTHEDAIN', 'CARDOLAN'],
            SIDEWAYS: ['RHUDAUR', 'ENEDWAITH'],
        },
        currentOccupants: [],
    },
    ENEDWAITH: {
        title: 'ENEDWAITH',
        description: 'ENEDWAITH',
        id: 12,
        maxChars: 2,
        directions: {
            UP: ['CARADHRAS', 'GAPROHAN'],
            DOWN: ['CARDOLAN'],
            SIDEWAYS: ['EREGION'],
        },
        currentOccupants: [],
    },
    ARTHEDAIN: {
        title: 'ARTHEDAIN',
        description: 'ARTHEDAIN',
        id: 13,
        maxChars: 2,
        directions: {
            UP: ['RHUDAUR', 'EREGION'],
            DOWN: ['SHIRE'],
            SIDEWAYS: ['CARDOLAN'],
        },
        currentOccupants: [],
    },
    CARDOLAN: {
        title: 'CARDOLAN',
        description: 'CARDOLAN',
        id: 14,
        maxChars: 2,
        directions: {
            UP: ['EREGION', 'ENEDWAITH'],
            DOWN: ['SHIRE'],
            SIDEWAYS: ['ARTHEDAIN'],
        },
        currentOccupants: [],
    },
    SHIRE: {
        title: 'SHIRE',
        description: 'The Shire',
        id: 15,
        maxChars: 4,
        directions: {
            UP: ['ARTHEDAIN', 'CARDOLAN'],
            DOWN: [],
            SIDEWAYS: [],
        },
        currentOccupants: [],
    },
}

export const GOOD_CARDS: BattleCard[] = [
    {id: 0, value: 1, type: 'strength'},
    {id: 1, value: 2, type: 'strength'},
    {
        id: 2,
        value: 3,
        type: 'strength'
    },
    {id: 3, value: 4, type: 'strength'},
    {id: 4, value: 5, type: 'strength'},
    {
        id: 5,
        title: 'Magic',
        description: 'Choose a discarded card to play',
        full: 'A player who plays this card during a battle must immediately replace it with any one of his discarded (previously played) cards. If a player has no previously played cards, this card has no strength value or effect. If both players play their “Magic” card simultaneously, the Sauron player chooses his replacement card first.\n',
        type: 'text',
    }, {
        id: 6,
        title: 'Noble Sacrifice',
        description: 'Both characters lose (Unless Evil played Retreat)',
        full: 'If this card is played, both characters involved in the battle are defeated – unless the Sauron player has played his “Retreat” card, in which case neither character is defeated (but both cards are still discarded).',
        type: 'text',
    }, {
        id: 7,
        title: 'Elven Cloak',
        description: 'Invalidates an Evil strength card',
        full: 'If the Fellowship player has played this card and the Sauron player has played any of his Strength Cards, the strength value of the Sauron player’s Strength Card is ignored. If the Sauron player has played his “Magic” card and replaced it with a Strength Card, that Strength Card is likewise ignored. ',
        type: 'text',
    }, {
        id: 8,
        title: 'Retreat (Backwards)',
        description: 'Retreat backwards as long as there is a free region to do so (No Evil character in region / not max number of Good characters in region)',
        full: 'The Fellowship player moves his character backwards to an adjacent region, as long as this region contains no Sauron characters and isn’t occupied by the maximum number of Fellowship characters (in which case there can be no retreat, and the battle proceeds).',
        type: 'text',
    },
]

export const EVIL_CARDS: BattleCard[] = [
    {id: 0, value: 1, type: 'strength'},
    {id: 1, value: 2, type: 'strength'},
    {
        id: 2,
        value: 3,
        type: 'strength'
    },
    {id: 3, value: 4, type: 'strength'},
    {id: 4, value: 5, type: 'strength'},
    {id: 5, value: 6, type: 'strength'},
    {
        id: 6,
        title: 'Magic',
        description: 'Choose a discarded card to play (If Good played Magic, Evil selects and shows their card first)',
        full: 'A player who plays this card during a battle must immediately replace it with any one of his discarded (previously played) cards. If a player has no previously played cards, this card has no strength value or effect. If both players play their “Magic” card simultaneously, the Sauron player chooses his replacement card first.',
        type: 'text',
    }, {
        id: 7,
        title: 'The Eye Of Sauron',
        description: 'Invalidates the Good text card (if played)',
        full: 'When the Sauron player plays this card and the Fellowship player has played a Text Card, the text on the Fellowship player’s card is ignored. If the Fellowship player has played a Strength Card, then “The Eye of Sauron” card has no effect',
        type: 'text',
    }, {
        id: 8,
        title: 'Retreat (Sideways)',
        description: 'Retreat sideways as long as there is a free region to do so (not in the mountains / no Good character in region / not max number of Evil characters in region)',
        full: 'The Sauron player immediately moves his character sideways into an adjacent region, as long as this region is not a mountain region, contains no Fellowship characters, and isn’t occupied by the maximum number of Sauron characters. When the Sauron player uses this card to retreat from a battle, the Fellowship player’s “Noble Sacrifice” card has no effect in that battle.',
        type: 'text',
    },
]

export const GOOD_SPECIAL_CARDS: SpecialCard[] = [
    {
        id: 1,
        title: 'Shadowfax',
        description: 'Move your piece twice in 1 move',
        full: 'During the Fellowship player’s turn, before he moves a character, the Fellowship player can use the Shadowfax card to move a Fellowship character forward to an adjacent region as long as there are no Sauron characters in that region and that region does not contain the maximum number of Fellowship characters. (The character can move along the Anduin, and through the Tunnel of Moria – and is defeated normally if the Sauron player reveals the Balrog in Caradhras.) The Fellowship player must then move this same character normally during his turn.',
    }, {
        id: 2,
        title: 'Gandalf the White',
        description: 'Revive Defeated Gandalf',
        full: 'This card can be played after the Sauron player has finished his turn. The Fellowship player must skip his entire turn to use this card. When played, the Fellowship player may bring a defeated Gandalf back into play, by placing the Gandalf character in Fangorn. The Fellowship player may not play this card if Fangorn is occupied by any Sauron character, or if two other Fellowship characters are in Fangorn. This card may not be used unless Gandalf has already been defeated',
    }, {
        id: 3,
        title: 'A King Revealed',
        description: 'Force evil to move a piece of your choosing',
        full: 'This card can be played after the Sauron player has finished his turn. The Fellowship player must skip his entire turn to use this card. When played, the Fellowship player must reveal Aragorn to choose a Sauron character piece. The Sauron player must move that character piece during his next turn (the Sauron player may therefore not skip his next turn to play a Special Card). The Fellowship player may not choose The Watcher if that character has already been revealed. The Fellowship player may not play “A King Revealed” if Aragorn has been defeated',
    }, {
        id: 4,
        title: 'Gwaihir the Windlord',
        description: 'Allow your character to insantly retreat',
        full: 'This card can be played at the beginning of a battle, before character texts are resolved. The Fellowship character gains the ability “Immediately retreat sideways or backwards” (replacing the character’s normal text) for the duration of that battle only. The Fellowship player may not play Gwaihir the Windlord in a battle against the Warg. ',
    },
]

export const EVIL_SPECIAL_CARDS: SpecialCard[] = [
    {
        id: 5,
        title: 'Palantir',
        description: 'Reveal all Good characters in any non-Shire region',
        full: 'The Sauron player can play this card at any point during his turn to reveal all Fellowship characters in one region, except in The Shire. The Fellowship player may not shuffle the characters in this region until the Sauron player’s turn is completely over.',
    }, {
        id: 6,
        title: 'Recall to Mordor',
        description: 'Return an Evil character to Mordor',
        full: 'This card can be played after the Fellowship player has finished his turn. The Sauron player must skip his entire turn to use this card. When played, the Sauron player may take one of the Sauron characters anywhere on the board and place it back in Mordor. The Sauron player may not do this if Mordor is occupied by any Fellowship characters, or four Sauron characters.',
    }, {
        id: 7,
        title: 'The Dark of Mordor',
        description: 'Move an extra Evil character',
        full: 'During the Sauron player’s turn, before he moves a character, he can use this card to move a Sauron character forward to an adjacent region as long as there are no Fellowship characters in that region and it does not contain the maximum number of Sauron characters. Then, the Sauron player must move a different Sauron character as normal. This card may not be used to move a revealed The Watcher character forward.',
    }, {
        id: 8,
        title: 'Crebain of Dunland',
        description: 'Permanently reveal a good character',
        full: 'This card can be played after the Fellowship player has finished his turn. The Sauron player must skip his entire turn to use this card. When played, the Sauron player may choose and reveal a Fellowship character. That character must remain revealed for the remainder of the game. If Gandalf is chosen, then later defeated, but returned to play with the “Gandalf the White” Special Card, the new Gandalf is no longer affected by the “Crebain of Dunland”.',
    },
]

export const GOOD_CHARS:CharacterMap = {
    'FRODO': {
        name: 'Frodo',
        id: 'FRODO',
        value: 1,
        description: 'When in battle against Frodo, the Sauron\n' +
            'player’s Text Card is ignored. If Frodo is\n' +
            'defeated, Sam is the new Ringbearer. If the\n' +
            'Warg defeats Frodo, or if Sam has already been defeated,\n' +
            'the Sauron player immediately wins the game.'
    },
    'SAM': {
        name: 'Sam',
        id: 'SAM',
        value: 1,
        description: 'If attacked, the Strength value on Sam’s\n' +
            'character is equal to that of the Sauron character. Combat Cards and character special\n' +
            'abilities such as Gandalf’s are added to\n' +
            'Sam’s Strength value normally. If Sam is attacked by\n' +
            'the Orcs, his Strength is 6.',
    },
    'ELROND': {
        name: 'Elrond',
        id: 'ELROND',
        value: 3,
        description: "When in battle against Elrond, the Sauron\n" +
            "Player’s “Eye of Sauron” and “Magic” cards\n" +
            "are ignored during that battle."
    },
    'GANDALF': {
        name: 'Gandalf',
        id: 'GANDALF',
        value: 5,
        description: "After Combat Cards have been revealed\n" +
            "during a battle taking place in a region adjacent to Gandalf’s (even a mountain region)\n" +
            "or in Gandalf’s own region, the Fellowship player may\n" +
            "reveal Gandalf to add 1 to the Strength of the engaged\n" +
            "Fellowship character. Gandalf may use his special ability\n" +
            "even if no cards have been played due to Aragorn’s\n" +
            "or Saruman’s ability. Gandalf may not\n" +
            "use his ability if the battle is against the Warg. Gandalf\n" +
            "may not use his ability if he attacks or is attacked himself. "
    },
    'ARAGORN': {
        name: 'Aragorn',
        id: 'ARAGORN',
        value: 4,
        description: "If attacked, Aragorn may decide that no\n" +
            "Combat Cards shall be used in the battle. "
    },
    'TREEBEARD': {
        name: 'Treebeard',
        id: 'TREEBEARD',
        value: 4,
        description: "Treebeard’s Strength value is increased to 6\n" +
            "while he is in Fangorn. Treebeard may move\n" +
            "from any region on the board to Fangorn, as\n" +
            "long as Fangorn is occupied by a single Sauron character. Otherwise, for moving into any other region,\n" +
            "Treebeard is restricted to the normal movement rules."
    },
    'FARAMIR': {
        name: 'Faramir',
        id: 'FARAMIR',
        value: 3,
        description: "When attacking, Faramir may retreat sideways. Faramir can only use his ability to\n" +
            "retreat at the beginning of a battle, and not\n" +
            "after cards have already been\n" +
            "played. The retreat does not\n" +
            "count as a normal move."
    },
    'THEODEN': {
        name: 'Theoden',
        id: 'THEODEN',
        value: 2,
        description: "Theoden’s\n" +
            "Strength value\n" +
            "increases to 4\n" +
            "while he is in Rohan or\n" +
            "Gondor, even if he attacks\n" +
            "into Rohan or Gondor. "
    },
    'SMEAGOL': {
        name: 'Smeagol',
        id: 'SMEAGOL',
        value: 0,
        description: "If Smeagol is attacked, and there are no\n" +
            "other Fellowship characters in his region, he\n" +
            "may switch positions with an adjacent\n" +
            "Fellowship character. Smeagol may not make a sideways\n" +
            "switch with an adjacent character in the mountains.\n" +
            "Smeagol can only use his ability at the beginning of a\n" +
            "battle, and not after cards have already been played. The\n" +
            "switch does not count as a normal move. If the Orcs\n" +
            "(classic) attack Smeagol, he may make the switch before\n" +
            "he is defeated.\n" +
            "If Smeagol switches with an adjacent character, the new\n" +
            "character will take his place in the battle. Resolve the\n" +
            "new Fellowship character’s text as if he had been\n" +
            "attacked."
    },
}

export const EVIL_CHARS: CharacterMap = {
    'URUKHAI': {
        name: 'The Uruk-Hai',
        id: 'URUKHAI',
        value: 4,
        description: "The Uruk-Hai can reveal themselves to\n" +
            "move forward any number of regions as\n" +
            "long as they end their movement in an\n" +
            "empty region. When doing so, the Uruk-Hai may never\n" +
            "move into or through a region already containing the\n" +
            "maximum number of Sauron characters, nor move\n" +
            "through a region occupied by one or more Fellowship\n" +
            "characters. Otherwise, the Uruk-Hai are restricted to the\n" +
            "normal movement rules."
    },
    'WITCHKING': {
        name: 'The Witch King',
        id: 'WITCHKING',
        value: 2,
        description: "The Sauron player wins immediately if the\n" +
            "Witch King enters the Shire (regardless of\n" +
            "whether or not there are any enemy characters in the region)."
    },
    'SARUMAN': {
        name: 'Saruman',
        id: 'SARUMAN',
        value: 3,
        description: "Saruman defeats Gandalf immediately\n" +
            "before any cards are played. After the\n" +
            "Fellowship player reveals his card in a battle\n" +
            "against Saruman, Saruman may force him to reveal a different card. Saruman may not use his ability if Aragorn\n" +
            "(variant) decides that no cards are played, or if the\n" +
            "Fellowship player only has one remaining Combat Card.\n" +
            "If Saruman forces the Fellowship player to reveal a new\n" +
            "card, the Fellowship player’s original card is placed back\n" +
            "into his hand."
    },
    'ORCS': {
        name: 'The Orcs',
        id: 'ORCS',
        value: 3,
        description: "When the Orcs attack, their Strength value is increased to 6."
    },
    'WORMTONGUE': {
        name: 'Wormtongue',
        id: 'WORMTONGUE',
        value: -1,
        description: "If defeated, Wormtongue may retreat backwards into an empty, adjacent region.\n" +
            "Wormtongue may even retreat if he was\n" +
            "defeated by Boromir or the “Noble Sacrifice” card. If\n" +
            "Wormtongue is unable to retreat, he is removed from the\n" +
            "game."
    },
    'MOUTH': {
        name: 'The Mouth of Sauron',
        id: 'MOUTH',
        value: 3,
        description: "After cards are revealed in battle, the Sauron\n" +
            "player may replace his played card with his\n" +
            "“4” Strength Card (even if the “4” card is in\n" +
            "the discard pile). If the “4” card is taken from the discard\n" +
            "pile, the original card played must be placed among the\n" +
            "discarded cards. If the “4” card is taken from the Sauron\n" +
            "player’s hand, then the original card played is returned to\n" +
            "the Sauron player’s hand.\n" +
            "The Mouth of Sauron may not use his ability if Aragorn\n" +
            "decides that no cards are played."
    },
    'WATCHER': {
        name: 'The Watcher',
        id: 'WATCHER',
        value: 6,
        description: "Once revealed, the Watcher remains\n" +
            "revealed for the remainder of the game and\n" +
            "may not move forward. The Watcher may\n" +
            "retreat sideways with the Sauron player’s “Retreat” card\n" +
            "or be placed back in Mordor with the “Recall to Mordor”\n" +
            "Special Cards (but remains revealed in both instances)."
    },
    'FLYINGNAZGUL': {
        name: 'The Flying Nazgul',
        id: 'FLYINGNAZGUL',
        value: 5,
        description: "The Flying Nazgul may move forward,\n" +
            "skipping over one region to attack. It may\n" +
            "even skip over a region that contains the\n" +
            "maximum number of Shadow characters or a region\n" +
            "occupied by one or more Fellowship characters.\n" +
            "Otherwise, the Flying Nazgul is restricted to the normal\n" +
            "movement rules."
    },
    'GOLLUM': {
        name: 'Gollum',
        id: 'GOLLUM',
        value: 1,
        description: "When in battle, Gollum may retreat forward.\n" +
            "Gollum can only use his ability to retreat at\n" +
            "the beginning of a battle, and not after cards\n" +
            "have already been played. The retreat does not count as a\n" +
            "normal move. Gollum may not retreat if the Fellowship\n" +
            "character has already retreated."
    },
}


