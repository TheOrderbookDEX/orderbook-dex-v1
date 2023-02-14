import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { Account, Addresses } from '@frugal-wizard/contract-test-helper';
import { describeTransferOrderAction } from '../describe/transferOrder';

export function createTransferOrderAction({
    orderType,
    price,
    orderId,
    newOwner,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
}: {
    orderType: OrderType;
    price: bigint;
    orderId: bigint;
    newOwner: Account | Addresses.ZERO;
    hideOrderType?: boolean;
    hidePrice?: boolean;
    hideOrderId?: boolean;
}): OrderbookAction {

    return {
        description: describeTransferOrderAction({
            orderType,
            price,
            orderId,
            newOwner,
            hideOrderType,
            hidePrice,
            hideOrderId,
        }),

        async execute({ addressBook, orderbook, [newOwner]: newOwnerAddress }) {
            const from = await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner);
            await orderbook.transferOrder(orderType, price, orderId, newOwnerAddress, { from });
        },

        apply(orders) {
            if (newOwner == Addresses.ZERO) {
                throw new Error('cannot transfer to zero address');
            }
            return orders.transfer(orderType, price, orderId, newOwner);
        }
    };
}
