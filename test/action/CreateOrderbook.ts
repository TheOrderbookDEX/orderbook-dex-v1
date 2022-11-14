import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { OrderbookFactoryAction, OrderbookFactoryActionProperties } from './OrderbookFactory';
import { OrderbookFactoryContext } from '../scenario/OrderbookFactory';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';

export interface CreateOrderbookActionProperties extends OrderbookFactoryActionProperties {
    readonly addressBookAddress?: string;
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
}

export class CreateOrderbookAction extends OrderbookFactoryAction {
    readonly addressBookAddress?: string;
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize: bigint;
    readonly priceTick: bigint;

    constructor({
        addressBookAddress,
        tradedTokenAddress,
        baseTokenAddress,
        contractSize = parseValue(10),
        priceTick = parseValue(1),
        ...rest
    }: CreateOrderbookActionProperties) {
        super(rest);
        this.addressBookAddress = addressBookAddress;
        this.tradedTokenAddress = tradedTokenAddress;
        this.baseTokenAddress = baseTokenAddress;
        this.contractSize = contractSize;
        this.priceTick = priceTick;
    }

    async execute(ctx: OrderbookFactoryContext) {
        const { contractSize, priceTick } = this;
        const { orderbookFactory } = ctx;
        const tradedToken = this.tradedTokenAddress ?
            ERC20Mock.at(this.tradedTokenAddress) :
            await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
        const baseToken = this.baseTokenAddress ?
            ERC20Mock.at(this.baseTokenAddress) :
            await ERC20Mock.deploy('Base Token', 'BASE', 18);
        await orderbookFactory.createOrderbook(tradedToken, baseToken, contractSize, priceTick);
    }

    apply<T>(state: T) {
        return state;
    }
}
