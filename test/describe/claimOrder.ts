import { formatValue, MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';
import { Account, describeSetupActions } from '@frugal-wizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { describeOrderType, OrderType } from '../state/OrderType';
import { describeOrderbookProps } from './orderbook';

export function describeClaimOrderAction({
    orderType,
    price,
    orderId,
    maxAmount,
    account,
    hideOrderType,
    hidePrice,
    hideAmount,
    hideOrderId,
    hideAccount,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount: bigint;
    readonly account: string;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideAmount: boolean;
    readonly hideOrderId: boolean;
    readonly hideAccount: boolean;
}): string {
    if (maxAmount == MAX_UINT32) {
        hideAmount = true;
    }
    const description = ['claim'];
    if (!hideAmount) {
        description.push(String(maxAmount));
        description.push('or less contracts');
        if (!hideOrderType || !hidePrice || !hideOrderId) {
            description.push('of');
        }
    }
    if (!hideOrderType) {
        description.push(describeOrderType(orderType));
    }
    if (!hideOrderType && !hidePrice) {
        description.push('at');
    }
    if (!hidePrice) {
        description.push(formatValue(price));
    }
    if (!hideOrderId) {
        description.push(`order #${orderId}`);
    } else if (hideAmount || !hideOrderType || !hidePrice) {
        description.push('order');
    }
    if (!hideAccount && account != Account.MAIN) {
        description.push(`using ${account}`)
    }
    return description.join(' ');
}

export function describeClaimOrderScenario({
    orderType,
    price,
    orderId,
    maxAmount,
    fee,
    contractSize,
    priceTick,
    hideOrderType,
    hidePrice,
    hideAmount,
    hideOrderId,
    hideContractSize,
    hidePriceTick,
    setupActions,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount: bigint;
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideAmount: boolean;
    readonly hideOrderId: boolean;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
    readonly setupActions: OrderbookAction[];
}): string {
    return `${describeClaimOrderAction({
        orderType,
        price,
        orderId,
        maxAmount,
        account: Account.MAIN,
        hideOrderType,
        hidePrice,
        hideAmount,
        hideOrderId,
        hideAccount: true,
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
