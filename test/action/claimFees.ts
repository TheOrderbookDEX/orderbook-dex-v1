import { OrderbookAction } from './orderbook';
import { describeClaimFeesAction } from '../describe/claimFees';

export function createClaimFeesAction(): OrderbookAction {

    return {
        description: describeClaimFeesAction(),

        async execute({ treasury, orderbook }) {
            await treasury.claimFees(orderbook);
        },

        apply(orders) {
            return orders;
        }
    };
}
