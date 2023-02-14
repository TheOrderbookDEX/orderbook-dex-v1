import { formatValue } from '@frugal-wizard/abi2ts-lib';
import { Account, describeSetupActions } from '@frugal-wizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { describeOrderType, OrderType } from '../state/OrderType';
import { describeOrderbookProps } from './orderbook';

export function describePlaceOrderAction({
    orderType,
    price,
    amount,
    account,
    hideOrderType,
    hidePrice,
    hideAmount,
    hideAccount,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly account: string;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideAmount: boolean;
    readonly hideAccount: boolean;
}): string {
    const description = ['place'];
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
    if (!hideAmount) {
        description.push('of');
        description.push(String(amount));
        description.push(`contract${ amount != 1n ? 's' : '' }`);
    }
    if (!hideAccount && account != Account.MAIN) {
        description.push(`using ${account}`)
    }
    return description.join(' ');
}

export function describePlaceOrderScenario({
    orderType,
    price,
    amount,
    fee,
    contractSize,
    priceTick,
    hideOrderType,
    hidePrice,
    hideAmount,
    hideContractSize,
    hidePriceTick,
    setupActions,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideAmount: boolean;
    readonly hideContractSize: boolean;
    readonly hidePriceTick: boolean;
    readonly setupActions: OrderbookAction[];
}): string {
    return `${describePlaceOrderAction({
        orderType,
        price,
        amount,
        account: Account.MAIN,
        hideOrderType,
        hidePrice,
        hideAmount,
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
