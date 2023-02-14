import { formatValue, MAX_UINT256, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { Account, describeSetupActions } from '@frugal-wizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { describeOrderType, OrderType } from '../state/OrderType';
import { describeOrderbookProps } from './orderbook';

export function describeFillAction({
    orderType,
    maxAmount,
    maxPrice,
    maxPricePoints,
    account,
    hideOrderType,
    hidePrice,
    hideAmount,
    hideAccount,
}: {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;
    readonly account: string;
    readonly hideOrderType: boolean;
    readonly hidePrice: boolean;
    readonly hideAmount: boolean;
    readonly hideAccount: boolean;
}): string {
    if (orderType == OrderType.SELL && maxPrice == MAX_UINT256) {
        hidePrice = true;
    } else if (orderType == OrderType.BUY && maxPrice == 0n) {
        hidePrice = true;
    }
    const description = ['fill'];
    if (!hideAmount) {
        description.push(`${maxAmount} or less contracts`);
        if (!hideOrderType || !hidePrice) {
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
        description.push(`${formatValue(maxPrice)} or better`);
    }
    if (hideAmount || !hideOrderType || !hidePrice) {
        description.push('orders');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push(`for at most ${maxPricePoints} pricepoint${maxPricePoints!=1?'s':''}`);
    }
    if (!hideAccount && account != Account.MAIN) {
        description.push(`using ${account}`)
    }
    return description.join(' ');
}

export function describeFillScenario({
    orderType,
    maxAmount,
    maxPrice,
    maxPricePoints,
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
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;
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
    return `${describeFillAction({
        orderType,
        maxAmount,
        maxPrice,
        maxPricePoints,
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
