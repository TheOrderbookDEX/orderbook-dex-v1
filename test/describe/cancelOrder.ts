import { formatValue } from '@frugal-wizard/abi2ts-lib';
import { Account, describeSetupActions } from '@frugal-wizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { describeOrderType, OrderType } from '../state/OrderType';
import { describeOrderbookProps } from './orderbook';

export function describeCancelOrderAction({
    orderType,
    price,
    orderId,
    account,
    hideOrderType,
    hidePrice,
    hideOrderId,
    hideAccount,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly account: string;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideOrderId: boolean;
    readonly hideAccount: boolean;
}): string {
    const description = ['cancel'];
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
    if (!hideAccount && account != Account.MAIN) {
        description.push(`using ${account}`)
    }
    return description.join(' ');
}

export function describeCancelOrderScenario({
    orderType,
    price,
    orderId,
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
    return `${describeCancelOrderAction({
        orderType,
        price,
        orderId,
        account: Account.MAIN,
        hideOrderType,
        hidePrice,
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
