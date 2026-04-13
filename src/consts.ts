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

export const CLASSIC_GOOD_CHARS: CharacterMap = {
    'CLASSICFRODO': {
        name: 'Frodo',
        id: 'CLASSICFRODO',
        value: 1,
        classic: true,
        description: 'Frodo can retreat sideways when attacked, but not if he himself is the attacker. Frodo can only use his ability to retreat at the beginning of a battle, and not after cards have already been played. The retreat does not count as a normal move. Frodo can never retreat sideways in the mountains.'
    },
    'CLASSICSAM': {
        name: 'Sam',
        id: 'CLASSICSAM',
        value: 2,
        classic: true,
        description: "If Sam is in the same region as Frodo, and  Frodo is attacked first, the Fellowship player  may reveal Sam and replace Frodo in the  battle. If Sam replaces Frodo in battle with the Orcs  (classic version), the Orcs immediately defeat Sam. Sam  is strength 5 when in the same region as Frodo, but the  Fellowship player must reveal both Frodo and Sam at  the beginning of a battle in order to prove Sam’s  strength. In battle against the Warg, the text on the  Fellowship characters (and therefore also Sam’s special  ability, including his ability to replace Frodo) is ignored.  Since the character limit in mountain regions is  one, Sam can never accompany Frodo  in the mountains"
    },
    'PIPPIN': {
        name: 'Pippin',
        id: 'PIPPIN',
        value: 1,
        classic: true,
        description: "When Pippin attacks, he can retreat backwards to an adjacent region after both characters have been revealed for battle. Pippin  can only use his ability to retreat at the beginning of battle, and not after cards have already been played. The  retreat does not count as a normal move."
    },
    'MERRY': {
        name: 'Merry',
        id: 'MERRY',
        value: 2,
        classic: true,
        description: "Merry defeats the Witch King immediately  before any cards are played. In battles  against all other enemies, the usual rules  apply."
    },
    'CLASSICGANDALF': {
        name: 'Gandalf',
        id: 'CLASSICGANDALF',
        value: 5,
        classic: true,
        description: "In a battle against Gandalf, should  the battle come to playing cards,  the Sauron player must choose  and play his card first. After the Sauron  player has revealed his card, the  Fellowship player chooses and plays  his card (the Fellowship player must  play a card, even if the Sauron player  played his “Retreat” card). If the  Sauron player plays his “Magic”  card (see above), he must completely resolve it and reveal his new card  before the Fellowship player must  choose and play a card. "
    },
    'CLASSICARAGORN': {
        name: 'Aragorn',
        id: 'CLASSICARAGORN',
        value: 4,
        classic: true,
        description: "Aragorn can move into any  adjacent region – forwards,  sideways, or backwards – if  he attacks at least one enemy character  by doing so. Otherwise, Aragorn can  only move forward into an adjacent  region like the other characters. Aragorn  can attack the Warg using his special ability, since he uses his ability before he enters  the region with the Warg. Aragorn cannot  attack sideways in the mountains."
    },
    'LEGOLAS': {
        name: 'Legolas',
        id: 'LEGOLAS',
        value: 3,
        classic: true,
        description: "Legolas defeats the Flying Nazgûl  immediately, before any cards are  played. In battles against all other  enemies, the usual rules apply."
    },
    'GIMLI': {
        name: 'Gimli',
        id: 'GIMLI',
        value: 3,
        classic: true,
        description: "Gimli defeats the Orcs immediately, before any cards are  played. In battles against all  other enemies, the usual rules apply"
    },
    'BOROMIR': {
        name: 'Boromir',
        id: 'BOROMIR',
        value: 0,
        classic: true,
        description: "If Boromir is in a battle, both characters are  defeated immediately. The only exceptions  are the Warg (in which case Boromir’s ability is ignored for that battle) and when Boromir uses the  Tunnel of Moria while the Balrog occupies Caradhras (in  which case Boromir is defeated without a battle)."
    },
}
export const CLASSIC_GOOD_NAMES = {
    CLASSICFRODO: 'CLASSICFRODO',
    CLASSICSAM: 'CLASSICSAM',
    PIPPIN: 'PIPPIN',
    MERRY: 'MERRY',
    CLASSICGANDALF: 'CLASSICGANDALF',
    CLASSICARAGORN: 'CLASSICARAGORN',
    LEGOLAS: 'LEGOLAS',
    GIMLI: 'GIMLI',
    BOROMIR: 'BOROMIR',
}
export const CLASSIC_EVIL_CHARS: CharacterMap = {
    'BALROG': {
        name: 'The Balrog',
        id: 'BALROG',
        value: 5,
        classic: true,
        description: "If the Balrog is in the Caradhras region  when a Fellowship character uses the Tunnel  of Moria (moving from Eregion directly to  Fangorn), the Sauron player may reveal the Balrog to  instantly defeat the Fellowship character without a battle  (even Frodo). The Balrog itself remains unharmed. Even  Boromir cannot harm the Balrog in this situation. A  Fellowship character that is defeated by the Balrog when  traveling through the Tunnel of Moria never reaches  Fangorn, so any Sauron character in Fangorn is not  revealed."
    },
    'SHELOB': {
        name: 'Shelob',
        id: 'SHELOB',
        value: 5,
        classic: true,
        description: "If not in Gondor, and Shelob defeats a  Fellowship character, she is immediately  returned to Gondor. Upon returning, if there  are already two other Sauron characters in Gondor, or if  there are one or more Fellowship characters in Gondor,  she is immediately defeated and removed from the game."
    },
    'CLASSICWITCHKING': {
        name: 'The Witch King',
        id: 'CLASSICWITCHKING',
        value: 5,
        classic: true,
        description: "The Witch King can move sideways into an  adjacent region if he attacks at least one  Fellowship character by doing so. Otherwise  he can only move forward into an adjacent region like  the other characters. He can never attack sideways in the  mountains. If the Witch King encounters Frodo in a sideways attack, Frodo may retreat sideways to the region  previously occupied by the Witch King, as long as no  other Sauron character is there."
    },
    'CLASSICFLYINGNAZGUL': {
        name: 'The Flying Nazgul',
        id: 'CLASSICFLYINGNAZGUL',
        value: 3,
        classic: true,
        description: "The Flying Nazgûl can move to any region  on the board, as long as that region is occupied by a single Fellowhip character. This  can potentially allow a Flying Nazgûl to attack an adjacent mountain region. Otherwise, for moving into any  other region, the Flying Nazgûl is restricted to the normal movement rules."
    },
    'BLACKRIDER': {
        name: 'The Black Rider',
        id: 'BLACKRIDER',
        value: 3,
        classic: true,
        description: "The Black Rider can move forward any  number of regions if he attacks at least one  Fellowship character by doing so. If the  Black Rider does not want to attack, then he can only  move forward into an adjacent region following the normal movement rules. The Black Rider may never move  into or through a region already containing the maximum number of Sauron characters, nor may he move  through a region occupied by one or more  Fellowship characters."
    },
    'CLASSICSARUMAN': {
        name: 'Saruman',
        id: 'CLASSICSARUMAN',
        value: 4,
        classic: true,
        description: "Saruman can decide that no cards shall be  used in a battle in which he participates. If  no characters are defeated (or retreat) before  Combat Cards are played, then the Sauron player may  choose that the battle will be decided by the character’s  Strength values only. All other normal rules for battle  apply."
    },
    'CLASSICORCS': {
        name: 'The Orcs',
        id: 'CLASSICORCS',
        value: 2,
        classic: true,
        description: "When the Orcs attack, they immediately  defeat the first Fellowship character attacked  in the region. Gimli immediately defeats the  Orcs and is therefore unharmed in any battle against  them. If the Orcs attack Boromir, both characters are  defeated. If there are additional Fellowship characters in  the region, the Orc’s special ability is ignored for those  subsequent battles. The Orcs have no special ability if  attacked by a Fellowship character.  If the Orcs attack Frodo first, Frodo may retreat sideways before the Orcs can defeat him. In this particular  case, this is still considered the first attack by the Orcs,  and they will have no special ability for the remainder of  the turn."
    },
    'WARG': {
        name: 'The Warg',
        id: 'WARG',
        value: 2,
        classic: true,
        description: "In battle against the Warg, the Fellowship  character’s text has no effect. Aragorn can  use his ability since he uses his ability in the  adjacent region, before the battle against the Warg."
    },
    'CAVETROLL': {
        name: 'The Cave Troll',
        id: 'CAVETROLL',
        value: 9,
        classic: true,
        description: "When it comes to playing cards in a battle  with the Cave Troll, the Sauron player’s card  is ignored. The Sauron player must still play  and discard a card, even though that card has no effect in  the battle."
    },
}
export const CLASSIC_EVIL_NAMES = {
    BALROG: "BALROG",
    SHELOB: "SHELOB",
    CLASSICWITCHKING: "CLASSICWITCHKING",
    CLASSICFLYINGNAZGUL: "CLASSICFLYINGNAZGUL",
    BLACKRIDER: "BLACKRIDER",
    CLASSICSARUMAN: "CLASSICSARUMAN",
    CLASSICORCS: "CLASSICORCS",
    WARG: "WARG",
    CAVETROLL: "CAVETROLL",
}
export const VARIANT_GOOD_CHARS: CharacterMap = {
    'VARIANTFRODO': {
        name: 'Frodo',
        id: 'VARIANTFRODO',
        value: 1,
        classic: false,
        description: 'When in battle against Frodo, the Sauron\n' +
            'player’s Text Card is ignored. If Frodo is\n' +
            'defeated, Sam is the new Ringbearer. If the\n' +
            'Warg defeats Frodo, or if Sam has already been defeated,\n' +
            'the Sauron player immediately wins the game.'
    },
    'VARIANTSAM': {
        name: 'Sam',
        id: 'VARIANTSAM',
        value: 1,
        classic: false,
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
        classic: false,
        description: "When in battle against Elrond, the Sauron\n" +
            "Player’s “Eye of Sauron” and “Magic” cards\n" +
            "are ignored during that battle."
    },
    'VARIANTGANDALF': {
        name: 'Gandalf',
        id: 'VARIANTGANDALF',
        value: 5,
        classic: false,
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
    'VARIANTARAGORN': {
        name: 'Aragorn',
        id: 'VARIANTARAGORN',
        value: 4,
        classic: false,
        description: "If attacked, Aragorn may decide that no\n" +
            "Combat Cards shall be used in the battle. "
    },
    'TREEBEARD': {
        name: 'Treebeard',
        id: 'TREEBEARD',
        value: 4,
        classic: false,
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
        classic: false,
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
        classic: false,
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
        classic: false,
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
export const VARIANT_GOOD_NAMES = {
    VARIANTFRODO: 'VARIANTFRODO',
    VARIANTSAM: 'VARIANTSAM',
    ELROND: 'ELROND',
    VARIANTGANDALF: 'VARIANTGANDALF',
    VARIANTARAGORN: 'VARIANTARAGORN',
    TREEBEARD: 'TREEBEARD',
    FARAMIR: 'FARAMIR',
    THEODEN: 'THEODEN',
    SMEAGOL: 'SMEAGOL',
}
export const VARIANT_EVIL_CHARS: CharacterMap = {
    'URUKHAI': {
        name: 'The Uruk-Hai',
        id: 'URUKHAI',
        value: 4,
        classic: false,
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
    'VARIANTWITCHKING': {
        name: 'The Witch King',
        id: 'VARIANTWITCHKING',
        value: 2,
        classic: false,
        description: "The Sauron player wins immediately if the\n" +
            "Witch King enters the Shire (regardless of\n" +
            "whether or not there are any enemy characters in the region)."
    },
    'VARIANTSARUMAN': {
        name: 'Saruman',
        id: 'VARIANTSARUMAN',
        value: 3,
        classic: false,
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
    'VARIANTORCS': {
        name: 'The Orcs',
        id: 'VARIANTORCS',
        value: 3,
        classic: false,
        description: "When the Orcs attack, their Strength value is increased to 6."
    },
    'WORMTONGUE': {
        name: 'Wormtongue',
        id: 'WORMTONGUE',
        value: -1,
        classic: false,
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
        classic: false,
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
        classic: false,
        description: "Once revealed, the Watcher remains\n" +
            "revealed for the remainder of the game and\n" +
            "may not move forward. The Watcher may\n" +
            "retreat sideways with the Sauron player’s “Retreat” card\n" +
            "or be placed back in Mordor with the “Recall to Mordor”\n" +
            "Special Cards (but remains revealed in both instances)."
    },
    'VARIANTFLYINGNAZGUL': {
        name: 'The Flying Nazgul',
        id: 'VARIANTFLYINGNAZGUL',
        value: 5,
        classic: false,
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
        classic: false,
        description: "When in battle, Gollum may retreat forward.\n" +
            "Gollum can only use his ability to retreat at\n" +
            "the beginning of a battle, and not after cards\n" +
            "have already been played. The retreat does not count as a\n" +
            "normal move. Gollum may not retreat if the Fellowship\n" +
            "character has already retreated."
    },
}
export const VARIANT_EVIL_NAMES = {
    URUKHAI: "URUKHAI",
    VARIANTWITCHKING: "VARIANTWITCHKING",
    VARIANTSARUMAN: "VARIANTSARUMAN",
    VARIANTORCS: "VARIANTORCS",
    WORMTONGUE: "WORMTONGUE",
    MOUTH: "MOUTH",
    WATCHER: "WATCHER",
    VARIANTFLYINGNAZGUL: "VARIANTFLYINGNAZGUL",
    GOLLUM: "GOLLUM"
}

export const GOOD_NAMES = {...CLASSIC_GOOD_NAMES, ...VARIANT_GOOD_NAMES}
export const EVIL_NAMES = {...CLASSIC_EVIL_NAMES, ...VARIANT_EVIL_NAMES}

export const GOOD_CHARS: CharacterMap = {
    ...CLASSIC_GOOD_CHARS,
    ...VARIANT_GOOD_CHARS,
}
export const EVIL_CHARS: CharacterMap = {
    ...CLASSIC_EVIL_CHARS,
    ...VARIANT_EVIL_CHARS,
}

export const DRAFT_PAIRS: Record<string, string> = {
    'WARG': 'GOLLUM',
    'GOLLUM': 'WARG',

    'GIMLI': 'THEODEN',
    'THEODEN': 'GIMLI',

    'MERRY': 'FARAMIR',
    'FARAMIR': 'MERRY',

    'BALROG': 'URUKHAI',
    'URUKHAI': 'BALROG',

    'PIPPIN': 'SMEAGOL',
    'SMEAGOL': 'PIPPIN',

    'BOROMIR': 'TREEBEARD',
    'TREEBEARD': 'BOROMIR',

    'LEGOLAS': 'ELROND',
    'ELROND': 'LEGOLAS',

    'SHELOB': 'WORMTONGUE',
    'WORMTONGUE': 'SHELOB',

    'CAVETROLL': 'WATCHER',
    'WATCHER': 'CAVETROLL',

    'BLACKRIDER': 'MOUTH',
    'MOUTH': 'BLACKRIDER',

    'CLASSICFRODO': 'VARIANTFRODO',
    'VARIANTFRODO': 'CLASSICFRODO',

    'CLASSICSAM': 'VARIANTSAM',
    'VARIANTSAM': 'CLASSICSAM',

    'CLASSICGANDALF': 'VARIANTGANDALF',
    'VARIANTGANDALF': 'CLASSICGANDALF',

    'CLASSICARAGORN': 'VARIANTARAGORN',
    'VARIANTARAGORN': 'CLASSICARAGORN',

    'CLASSICWITCHKING': 'VARIANTWITCHKING',
    'VARIANTWITCHKING': 'CLASSICWITCHKING',

    'CLASSICFLYINGNAZGUL': 'VARIANTFLYINGNAZGUL',
    'VARIANTFLYINGNAZGUL': 'CLASSICFLYINGNAZGUL',

    'CLASSICSARUMAN': 'VARIANTSARUMAN',
    'VARIANTSARUMAN': 'CLASSICSARUMAN',

    'CLASSICORCS': 'VARIANTORCS',
    'VARIANTORCS': 'CLASSICORCS',
}
