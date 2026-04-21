import './Board.css'
import {useEffect} from 'react'
import {GState} from './types';

export function AiController({ctx, G, moves}: {
    G: GState,
    ctx: any,
    moves: any
}) {
    const isGood = G.aiId === '1'
    const phase = ctx.phase
    const isAIPickSpecials = ctx.activePlayers?.[G.aiId] === 'specialCards' && (G.specialCardsPer || G.specialCardDefault)
    const isAIPickCard = ctx.activePlayers?.[G.aiId] === 'pickCards'
    const isAIPickMagicCard = ctx.activePlayers?.[G.aiId] === 'pickMagicCards'
    const goodCanPickMagic = G.goodCard?.title === 'Magic' && G.evilCardLocked
    // const evilCanPickMagic = G.evilCard?.title === 'Magic' && G.goodCardLocked
    const isGoodRetreat = ctx.activePlayers?.[G.aiId] === 'goodRetreat'
    const isBadRetreat = ctx.activePlayers?.[G.aiId] === 'badRetreat'
    const isGoodAction = ctx.activePlayers?.[G.aiId] === 'goodAction'
    const isBadAction = ctx.activePlayers?.[G.aiId] === 'badAction'
    const isMouthAction = ctx.activePlayers?.[G.aiId] === 'mouthCards'
    const isSarumanChoiceAction = ctx.activePlayers?.[G.aiId] === 'sarumanCards' && !G.oldGoodCard
    const isSarumanReselectAction = ctx.activePlayers?.[G.aiId] === 'sarumanCards' && G.oldGoodCard && !G.goodCardLocked
    const isGandalfChoiceAction = ctx.activePlayers?.[G.aiId] === 'gandalfChoice'
    const isGrimaRetreat = ctx.activePlayers?.[G.aiId] === 'grimaRetreat'
    const isSmeagolSwap = G.defendingChar === 'SMEAGOL' && G.swapOptions?.length > 0
    const foes = Boolean(G.attackingChar && G.defendingChar) ? G.attackingChar + G.defendingChar : false

    useEffect(() => {
        if (phase === 'place'){
            if(!isGood){
                if (isAIPickSpecials) {
                    moves.chooseAiCardOption()
                }
            }
        }
        else if (phase === 'battle') {
            if (isAIPickCard && foes) {
                moves.chooseAiCard()
            }
            if (isGood) {
                if (isAIPickMagicCard && goodCanPickMagic) {
                    moves.chooseAiMagicCard()
                } else if (isGoodAction) {
                    moves.aiChooseGoodAction()
                } else if (isGandalfChoiceAction) {
                    moves.useAiGandalfOption()
                } else if (isGoodRetreat) {
                    if (isSmeagolSwap) {
                        moves.chooseAiSmeagolSwap()
                    } else {
                        moves.chooseAiRetreat()
                    }
                } else if (isSarumanReselectAction) {
                    moves.aiSarumanCardReselect()
                }
            } else {
                if (isAIPickMagicCard && G.evilCard?.title === 'Magic') {
                    moves.chooseAiMagicCard()
                } else if (isBadAction) {
                    moves.aiChooseEvilAction()
                } else if (isMouthAction) {
                    moves.useMouthAiChoice()
                } else if (isBadRetreat) {
                    moves.chooseAiRetreat()
                } else if (isGrimaRetreat) {
                    moves.chooseAiRetreatRegion()
                } else if (isSarumanChoiceAction) {
                    moves.aiMakeGoodReselect()
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGood, phase, isAIPickCard, isAIPickMagicCard, isGoodAction, isBadAction,
        isMouthAction, isGandalfChoiceAction, isGoodRetreat, isBadRetreat, isSarumanReselectAction, isSarumanChoiceAction,
        isGrimaRetreat, isSmeagolSwap, isAIPickSpecials, goodCanPickMagic, foes]);

    return
}
