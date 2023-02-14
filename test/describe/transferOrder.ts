import { formatValue } from '@frugal-wizard/abi2ts-lib';
import { describeSetupActions } from '@frugal-wizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { describeOrderType, OrderType } from '../state/OrderType';
import { describeOrderbookProps } from './orderbook';

export function describeTransferOrderAction({
    orderType,
    price,
    orderId,
    newOwner,
    hideOrderType,
    hidePrice,
    hideOrderId,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly newOwner: string;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideOrderId: boolean;
}): string {
    const description = ['transfer'];
    if (!hideOrderType) {
        description.push(describeOrderType(orderType));
    }
    if (!hideOrderType && !hidePrice) {
        description.push('at');
    }
    if (!hidePrice) {
        description.push(formatValue(price));
    }
    description.push('order');
    if (!hideOrderId) {
        description.push(`#${orderId}`);
    }
    description.push(`to ${newOwner}`)
    return description.join(' ');
}

export function describeTransferOrderScenario({
    orderType,
    price,
    orderId,
    newOwner,
    fee,
    contractSize,
    priceTick,
    hideOrderType,
    hidePrice,
    hideOrderId,
    hideContractSize,
    hidePriceTick,
    setupActions,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly newOwner: string;
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideOrderId: boolean;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
    readonly setupActions: OrderbookAction[];
}): string {
    return `${describeTransferOrderAction({
        orderType,
        price,
        orderId,
        newOwner,
        hideOrderType,
        hidePrice,
        hideOrderId,
    })}${describeSetupActions(
        setupActions
    )}${describeOrderbookProps({
        fee,
        contractSize,
        priceTick,
        hideContractSize,
        hidePriceTick,
    })}`;
}
