import {
    EVIL_CARDS,
    GOOD_CARDS,
    LOCATIONS,
} from './consts.ts'
import * as Logic from './logic.ts'
import {PLACE, MOVE, BATTLE} from './moveLogic.ts'
import { GState, SpecialCard, BattleCard} from './types';

export const Confrontation = {
    name: 'Confrontation',
    setup: () => {
        return {
            history: [],
            messages: [],
            players: {
                0: {
                    side: 'evil',
                    cards: [...EVIL_CARDS],
                    // .map(c=>c.title !== 'Magic' ? {...c, discarded : true} : c)
                    charactersToPlace: [],
                    ambush: true,
                },
                1: {
                    side: 'good',
                    cards: [...GOOD_CARDS],
                    charactersToPlace: [],
                },
            },

            regions: LOCATIONS,
            characters: {},
            goodReady: false,
            evilReady: false,
        }
    },
    phases: {
        place: {
            start: true,
            turn: {
                stages: {
                    placement: {
                        moves: {
                            setMatchId: ({G}: { G: GState }, matchId: string) => {
                                return PLACE.setMatchId(G, matchId)
                            },
                            chooseCharacter: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }, charID: string) => {
                                return PLACE.chooseCharacter(G, playerID, charID)
                            },
                            autoPlace: ({G, playerID}: {
                                G: GState,
                                playerID: string,
                            }) => {
                                return PLACE.autoPlace(G, playerID)
                            },
                            reset: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }) => {
                                return PLACE.reset(G, playerID)
                            },
                            resetChar: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }, charId: string, tileId: string) => {
                                return PLACE.resetChar(G, playerID, charId, tileId)
                            },
                            placeCharacter: ({G, playerID}: {
                                G: GState
                                playerID: string,
                            }, tileId: string) => {
                                return PLACE.placeCharacter(G, playerID, tileId)
                            },
                            ready: ({G, playerID, events}: {
                                G: GState,
                                events: any,
                                playerID: string,
                            }) => {
                                return PLACE.ready(G, events, playerID)
                            },
                        },
                    },
                    specialCards: {
                        moves: {
                            chooseCardOption: ({G, events}: {
                                G: GState,
                                events: any,
                            }, type: 'default' | number) => {
                                return PLACE.chooseCardOption(G, events, type)
                            },
                            chooseCard: ({G, playerID, events}: {
                                G: GState,
                                events: any,
                                playerID: string,
                            }, card: SpecialCard) => {
                                return PLACE.chooseCard(G, events, playerID, card)
                            },
                        },
                    },
                },
                activePlayers: {all: 'placement'},
            },
            next: 'move',
        },
        move: {
            turn: {
                activePlayers: null,
                order: {
                    // Player 0 starts gameplay, unless we are overwriting
                    // broken turn logic from the battle phase
                    first: ({G}: { G: GState }) => (G.lastPlayerId ? Number(G.lastPlayerId) : 0),
                    next: ({ctx}) => {
                        // Alternate between Player 0 and Player 1
                        return ctx.currentPlayer === '0' ? 1 : 0
                    },
                },
                onBegin: ({G, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                }) => {
                    MOVE.onBegin(G, events, ctx)
                },
            },
            moves: {
                chooseCharacterToMove: ({G, playerID}: {
                    G: GState,
                    playerID: string
                }, charId: string, tileId: string) => {
                    return MOVE.chooseCharacterToMove(G, playerID, charId, tileId)
                },
                chooseRegionToMove: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string
                }, tileId: string) => {
                    return MOVE.chooseRegionToMove(G, events, playerID, tileId)
                },
                chooseSpecialCard: ({G, playerID, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }, card: SpecialCard) => {
                    return MOVE.chooseSpecialCard(G, events, ctx, playerID, card)
                },
                setAmbush: ({G, playerID, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }, setAmbush: boolean) => {
                    return MOVE.setAmbush(G, events, ctx, playerID, setAmbush)
                },
                // good specials
                kingRevealedChar: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string
                }, charId: string, tileId: string) => {
                    return MOVE.kingRevealedChar(G, events, playerID, charId, tileId)
                },
                // evil specials
                palantirRegion: ({G, playerID}: {
                    G: GState,
                    playerID: string
                }, tileId: string) => {
                    return MOVE.palantirRegion(G, playerID, tileId)
                },
                mordorRecall: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string,
                }, charId: string, tileId: string) => {
                    return MOVE.mordorRecall(G, events, playerID, charId, tileId)
                },
                crebain: ({G, playerID, events}: {
                    G: GState,
                    events: any,
                    playerID: string
                }, charId: string) => {
                    return MOVE.crebain(G, events, playerID, charId)
                },
            },
        },
        battle: {
            turn: {
                order: {
                    first: ({ctx}) => Number(ctx.currentPlayer),
                    next: ({ctx}) => {
                        // Alternate between Player 0 and Player 1
                        return ctx.currentPlayer === '0' ? 1 : 0
                    },
                },
                onBegin: (props: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }) => {
                    props.G.messages = []
                    Logic.checkReshuffle(props.G)

                    // start phase steps
                    Logic.startBattleLogic(props)
                },
                stages: {
                    goodAction: {
                        moves: {
                            chooseGoodAction: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, action: string) => {
                                return BATTLE.chooseGoodAction(G, events, ctx, playerID, action)
                            },
                        },
                    },
                    goodRetreat: {
                        moves: {
                            chooseSmeagolSwap: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, charId: string, tileId: string) => {
                                return BATTLE.chooseSmeagolSwap(G, events, ctx, playerID, charId, tileId)
                            },
                            chooseRetreatRegion: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, tileId: string) => {
                                return BATTLE.chooseRetreatRegion(G, events, ctx, playerID, tileId)
                            },
                        },
                    },
                    badAction: {
                        moves: {
                            chooseEvilAction: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, action: string) => {
                                return BATTLE.chooseEvilAction(G, events, ctx, playerID, action)
                            },
                        },
                    },
                    badRetreat: {
                        moves: {
                            chooseRetreatRegion: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, tileId: string) => {
                                return BATTLE.chooseBadRetreatRegion(G, events, ctx, playerID, tileId)
                            },
                        },
                    },
                    pickCards: {
                        moves: {
                            chooseCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, card: BattleCard) => {
                                return BATTLE.chooseCard(G, events, ctx, playerID, card)
                            },
                            lockInCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }) => {
                                return BATTLE.lockInCard(G, events, ctx, playerID)
                            },
                            cancelMagic: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }) => {
                                return BATTLE.cancelMagic(G, playerID)
                            },
                        },
                    },
                    pickMagicCards: {
                        moves: {
                            chooseMagicCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, card: BattleCard) => {
                                return BATTLE.chooseMagicCard(G, events, ctx, playerID, card)
                            },
                            lockInCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }) => {
                                return BATTLE.lockInMagicCard(G, events, ctx, playerID)
                            },
                        },
                    },
                    sarumanCards: {
                        moves: {
                            goodReselect: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, goodReselect: boolean) => {
                                return BATTLE.goodReselect(G, events, ctx, playerID, goodReselect)
                            },
                            chooseCard: ({G, playerID}: {
                                G: GState,
                                playerID: string
                            }, card: BattleCard) => {
                                return BATTLE.chooseSarumanCard(G, playerID, card)
                            },
                            lockInCard: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }) => {
                                return BATTLE.lockInSarumanCard(G, events, ctx, playerID)
                            },
                        },
                    },
                    mouthCards: {
                        moves: {
                            useMouthChoice: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, useMouthAbility: boolean) => {
                                return BATTLE.useMouthChoice(G, events, ctx, playerID, useMouthAbility)
                            },
                        },
                    },
                    gandalfChoice: {
                        moves: {
                            useGandalfOption: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, useGandalfAbility: boolean) => {
                                return BATTLE.useMouthChoice(G, events, ctx, playerID, useGandalfAbility)
                            },
                        },
                    },
                    grimaRetreat: {
                        moves: {
                            chooseRetreatRegion: ({G, playerID, events, ctx}: {
                                G: GState,
                                events: any,
                                ctx: any,
                                playerID: string
                            }, tileId: string) => {
                                return BATTLE.chooseGrimaRetreatRegion(G, events, ctx, playerID, tileId)
                            },
                        },
                    },
                },
            },
            moves: {
                chooseCharacterToAttack: ({G, playerID, events, ctx}: {
                    G: GState,
                    events: any,
                    ctx: any,
                    playerID: string
                }, charId: string) => {
                    return BATTLE.chooseCharacterToAttack(G, events, ctx, playerID, charId)
                },
            },
        },
        onEnd: ({G}: { G: GState }) => {
            G.messages = []
        },
    },
}
