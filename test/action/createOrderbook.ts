import { OrderbookFactoryAction } from './factory';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { describeCreateOrderbookAction } from '../describe/createOrderbook';
import { DEFAULT_CONTRACT_SIZE, DEFAULT_PRICE_TICK } from '../scenario/orderbook';

export function createCreateOrderbookAction({
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideContractSize = false,
    hidePriceTick = false,
}: {
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
}): OrderbookFactoryAction {

    return {
        description: describeCreateOrderbookAction({
            contractSize,
            priceTick,
            hideContractSize,
            hidePriceTick,
        }),

        async execute(ctx) {
            const { orderbookFactory } = ctx;
            const tradedToken = await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
            const baseToken = await ERC20Mock.deploy('Base Token', 'BASE', 18);
            await orderbookFactory.createOrderbook(tradedToken, baseToken, contractSize, priceTick);
        },
    };
}
