import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './Orderbook';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { Transaction } from '@frugal-wizard/abi2ts-lib';

export interface ClaimFeesScenarioProperties extends OrderbookScenarioProperties<OrderbookContext> {
    readonly usingTreasury?: boolean;
}

export class ClaimFeesScenario extends OrderbookScenario<OrderbookContext, Transaction, void> {
    readonly usingTreasury: boolean;

    constructor({
        usingTreasury = true,
        ...rest
    }: ClaimFeesScenarioProperties) {
        super(rest);
        this.usingTreasury = usingTreasury;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.usingTreasury) {
            addContext('using', 'treasury');
        }
        super.addContext(addContext);
    }

    async setup() {
        return await this._setup();
    }

    async execute({ treasury, orderbook }: OrderbookContext) {
        if (this.usingTreasury) {
            return await treasury.claimFees(orderbook);
        } else {
            return await orderbook.claimFees();
        }
    }

    async executeStatic({ treasury, orderbook }: OrderbookContext) {
        if (this.usingTreasury) {
            return await treasury.callStatic.claimFees(orderbook);
        } else {
            return await orderbook.callStatic.claimFees();
        }
    }

    get ordersAfter() {
        return this.ordersBefore;
    }
}
