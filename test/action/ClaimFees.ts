import { OrderbookAction, OrderbookActionProperties } from './Orderbook';
import { OrderbookContext } from '../scenario/Orderbook';

export type ClaimFeesActionProperties = OrderbookActionProperties;

export class ClaimFeesAction extends OrderbookAction {
    constructor({
        ...rest
    }: ClaimFeesActionProperties) {
        super(rest);
    }

    async execute(ctx: OrderbookContext) {
        const { treasury, orderbook, } = ctx;
        await treasury.claimFees(orderbook);
    }

    apply<T>(state: T) {
        return state;
    }
}
