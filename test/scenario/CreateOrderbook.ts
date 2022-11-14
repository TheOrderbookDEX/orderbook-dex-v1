import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { formatValue, parseValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { OrderbookFactoryContext, OrderbookFactoryScenario, OrderbookFactoryScenarioProperties } from './OrderbookFactory';

export interface CreateOrderbookContext extends OrderbookFactoryContext {
    readonly tradedToken: ERC20Mock;
    readonly baseToken: ERC20Mock;
}

export interface CreateOrderbookScenarioProperties extends OrderbookFactoryScenarioProperties<CreateOrderbookContext> {
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
}

export class CreateOrderbookScenario extends OrderbookFactoryScenario<CreateOrderbookContext, Transaction, string> {
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize: bigint;
    readonly priceTick: bigint;

    constructor({
        tradedTokenAddress,
        baseTokenAddress,
        contractSize = parseValue(10),
        priceTick = parseValue(1),
        ...rest
    }: CreateOrderbookScenarioProperties) {
        super(rest);
        this.tradedTokenAddress = tradedTokenAddress;
        this.baseTokenAddress = baseTokenAddress;
        this.contractSize = contractSize;
        this.priceTick = priceTick;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.tradedTokenAddress) {
            addContext('traded token address', this.tradedTokenAddress);
        }
        if (this.baseTokenAddress) {
            addContext('base token address', this.baseTokenAddress);
        }
        addContext('contractSize', formatValue(this.contractSize));
        addContext('priceTick', formatValue(this.priceTick));
        super.addContext(addContext);
    }

    protected async _setup(): Promise<CreateOrderbookContext> {
        const ctx = await super._setup();
        const tradedToken = this.tradedTokenAddress ?
            ERC20Mock.at(this.tradedTokenAddress) :
            await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
        const baseToken = this.baseTokenAddress ?
            ERC20Mock.at(this.baseTokenAddress) :
            await ERC20Mock.deploy('Base Token', 'BASE', 18);
        return { ...ctx, tradedToken, baseToken };
    }

    async setup() {
        return await this._setup();
    }

    async execute({ orderbookFactory, tradedToken, baseToken }: CreateOrderbookContext) {
        const { contractSize, priceTick } = this;
        return await orderbookFactory.createOrderbook(tradedToken, baseToken, contractSize, priceTick);
    }

    async executeStatic({ orderbookFactory, tradedToken, baseToken }: CreateOrderbookContext) {
        const { contractSize, priceTick } = this;
        return await orderbookFactory.callStatic.createOrderbook(tradedToken, baseToken, contractSize, priceTick);
    }
}
