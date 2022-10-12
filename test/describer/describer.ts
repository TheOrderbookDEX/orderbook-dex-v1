import { formatValue, MAX_UINT256, MAX_UINT32, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { Account, ConfigurableDescriber } from '@frugal-wizard/contract-test-helper';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { CancelOrderUsingPuppetAction } from '../action/CancelOrderUsingPuppetAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { ClaimOrderUsingPuppetAction } from '../action/ClaimOrderUsingPuppetAction';
import { FillAction } from '../action/FillAction';
import { FillUsingPuppetAction } from '../action/FillUsingPuppetAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { PlaceOrderUsingPuppetAction } from '../action/PlaceOrderUsingPuppetAction';
import { TransferOrderToOperatorAction } from '../action/TransferOrderToOperatorAction';
import { DeployOrderbookScenario } from '../scenario/DeployOrderbookScenario';
import { OperatorBuyAtMarketScenario } from '../scenario/OperatorBuyAtMarketScenario';
import { OperatorCancelOrderScenario } from '../scenario/OperatorCancelOrderScenario';
import { OperatorClaimOrderScenario } from '../scenario/OperatorClaimOrderScenario';
import { OperatorPlaceBuyOrderScenario } from '../scenario/OperatorPlaceBuyOrderScenario';
import { OperatorPlaceSellOrderScenario } from '../scenario/OperatorPlaceSellOrderScenario';
import { OperatorSellAtMarketScenario } from '../scenario/OperatorSellAtMarketScenario';
import { OperatorTransferOrderScenario } from '../scenario/OperatorTransferOrderScenario';
import { OrderbookCancelOrderScenario } from '../scenario/OrderbookCancelOrderScenario';
import { OrderbookClaimOrderScenario } from '../scenario/OrderbookClaimOrderScenario';
import { OrderbookFillScenario } from '../scenario/OrderbookFillScenario';
import { OrderbookPlaceOrderScenario } from '../scenario/OrderbookPlaceOrderScenario';
import { OrderbookReentrancyScenario } from '../scenario/OrderbookReentrancyScenario';
import { OrderbookTransferOrderScenario } from '../scenario/OrderbookTransferOrderScenario';
import { describeOrderType, OrderType } from '../state/OrderType';

export interface OrderbookTestDescriberConfig {
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideAmount?: boolean;
    readonly hideAccount?: boolean;
}

export const describer = new ConfigurableDescriber<OrderbookTestDescriberConfig>();

describer.addDescriber(PlaceOrderAction, function({
    orderType, price, amount, account
}, {
    hidePrice, hideOrderType, hideAmount, hideAccount
} = {}) {
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
});

describer.addDescriber(PlaceOrderUsingPuppetAction, function({
    orderType, price, amount
}, {
    hidePrice, hideOrderType, hideAmount, hideAccount
} = {}) {
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
    if (!hideAccount) {
        description.push('using puppet');
    }
    return description.join(' ');
});

describer.addDescriber(FillAction, function({
    orderType, maxAmount, maxPrice, maxPricePoints
}, {
    hidePrice, hideOrderType, hideAmount
} = {}) {
    if (orderType == OrderType.SELL && maxPrice == MAX_UINT256) {
        hidePrice = true;
    } else if (orderType == OrderType.BUY && maxPrice == 0n) {
        hidePrice = true;
    }
    const description = ['fill'];
    if (!hideAmount) {
        description.push(String(maxAmount));
        description.push('or less contracts');
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
        description.push(formatValue(maxPrice));
        description.push('or better');
    }
    if (hideAmount || !hideOrderType || !hidePrice) {
        description.push('orders');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push('for at most');
        description.push(String(maxPricePoints));
        description.push(`price point${maxPricePoints!=1?'s':''}`);
    }
    return description.join(' ');
});

describer.addDescriber(FillUsingPuppetAction, function({
    orderType, maxAmount, maxPrice, maxPricePoints
}, {
    hidePrice, hideOrderType, hideAmount, hideAccount
} = {}) {
    if (orderType == OrderType.SELL && maxPrice == MAX_UINT256) {
        hidePrice = true;
    } else if (orderType == OrderType.BUY && maxPrice == 0n) {
        hidePrice = true;
    }
    const description = ['fill'];
    if (!hideAmount) {
        description.push(String(maxAmount));
        description.push('or less contracts');
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
        description.push(formatValue(maxPrice));
        description.push('or better');
    }
    if (hideAmount || !hideOrderType || !hidePrice) {
        description.push('orders');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push('for at most');
        description.push(String(maxPricePoints));
        description.push(`price point${maxPricePoints!=1?'s':''}`);
    }
    if (!hideAccount) {
        description.push('using puppet');
    }
    return description.join(' ');
});

describer.addDescriber(ClaimOrderAction, function({
    orderType, price, orderId, maxAmount
}, {
    hidePrice, hideOrderType, hideOrderId, hideAmount
} = {}) {
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
    return description.join(' ');
});

describer.addDescriber(ClaimOrderUsingPuppetAction, function({
    orderType, price, orderId, maxAmount
}, {
    hidePrice, hideOrderType, hideOrderId, hideAmount, hideAccount
} = {}) {
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
    if (!hideAccount) {
        description.push('using puppet');
    }
    return description.join(' ');
});

describer.addDescriber(CancelOrderAction, function({
    orderType, price, orderId
}, {
    hidePrice, hideOrderType, hideOrderId
} = {}) {
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
    return description.join(' ');
});

describer.addDescriber(CancelOrderUsingPuppetAction, function({
    orderType, price, orderId
}, {
    hidePrice, hideOrderType, hideOrderId, hideAccount
} = {}) {
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
    if (!hideAccount) {
        description.push('using puppet');
    }
    return description.join(' ');
});

describer.addDescriber(TransferOrderToOperatorAction, function({
    orderType, price, orderId
}, {
    hidePrice, hideOrderType, hideOrderId
} = {}) {
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
    description.push('to operator');
    return description.join(' ');
});

describer.addDescriber(DeployOrderbookScenario, function({
    addressBookAddress, tradedTokenAddress, baseTokenAddress, contractSize, priceTick
}, config = {}) {
    const settings = [];
    if (addressBookAddress) {
        settings.push(`addressBook at ${addressBookAddress}`);
    }
    if (tradedTokenAddress) {
        settings.push(`tradedToken at ${tradedTokenAddress}`);
    }
    if (baseTokenAddress) {
        settings.push(`baseToken at ${baseTokenAddress}`);
    }
    if (!config.hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!config.hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    return `deploy${ settings.length ? ` with ${ settings.join(' and ') }` : '' }`;
});

describer.addDescriber(OrderbookPlaceOrderScenario, function({
    orderType, price, amount, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideAmount, hideContractSize, hidePriceTick
} = {}) {
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
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OrderbookFillScenario, function({
    orderType, maxAmount, maxPrice, maxPricePoints, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideAmount, hideContractSize, hidePriceTick
} = {}) {
    if (orderType == OrderType.SELL && maxPrice == MAX_UINT256) {
        hidePrice = true;
    } else if (orderType == OrderType.BUY && maxPrice == 0n) {
        hidePrice = true;
    }
    const description = ['fill'];
    if (!hideAmount) {
        description.push(String(maxAmount));
        description.push('or less contracts');
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
        description.push(formatValue(maxPrice));
        description.push('or better');
    }
    if (hideAmount || !hideOrderType || !hidePrice) {
        description.push('orders');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push('for at most');
        description.push(String(maxPricePoints));
        description.push(`price point${maxPricePoints!=1?'s':''}`);
    }
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OrderbookClaimOrderScenario, function({
    orderType, price, orderId, maxAmount, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideOrderId, hideAmount, hideContractSize, hidePriceTick
} = {}) {
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
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OrderbookCancelOrderScenario, function({
    orderType, price, orderId, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideOrderId, hideContractSize, hidePriceTick
} = {}) {
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
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OrderbookTransferOrderScenario, function({
    orderType, price, orderId, newOwner, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideOrderId, hideContractSize, hidePriceTick
} = {}) {
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
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OrderbookReentrancyScenario, function({
    compromisedToken, mainAction, reentrantAction, setupActions, contractSize, priceTick
}, {
    hideContractSize, hidePriceTick
} = {}) {
    const description = ['test reentrancy of'];
    description.push(reentrantAction.description);
    description.push('before transfer of');
    description.push(compromisedToken);
    description.push('in');
    description.push(mainAction.description);
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OperatorBuyAtMarketScenario, function({
    maxAmount, maxPrice, maxPricePoints, setupActions, contractSize, priceTick
}, {
    hidePrice, hideAmount, hideContractSize, hidePriceTick
} = {}) {
    if (maxPrice == MAX_UINT256) {
        hidePrice = true;
    }
    const description = ['buy at market'];
    if (!hideAmount) {
        description.push(String(maxAmount));
        description.push('or less contracts');
        if (!hidePrice) {
            description.push('of');
        }
    }
    if (!hidePrice) {
        description.push(formatValue(maxPrice));
        description.push('or better');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push('for at most');
        description.push(String(maxPricePoints));
        description.push(`price point${maxPricePoints!=1?'s':''}`);
    }
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OperatorSellAtMarketScenario, function({
    maxAmount, minPrice, maxPricePoints, setupActions, contractSize, priceTick
}, {
    hidePrice, hideAmount, hideContractSize, hidePriceTick
} = {}) {
    if (minPrice == 0n) {
        hidePrice = true;
    }
    const description = ['sell at market'];
    if (!hideAmount) {
        description.push(String(maxAmount));
        description.push('or less contracts');
        if (!hidePrice) {
            description.push('of');
        }
    }
    if (!hidePrice) {
        description.push(formatValue(minPrice));
        description.push('or better');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push('for at most');
        description.push(String(maxPricePoints));
        description.push(`price point${maxPricePoints!=1?'s':''}`);
    }
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OperatorPlaceBuyOrderScenario, function({
    maxAmount, price, maxPricePoints, setupActions, contractSize, priceTick
}, {
    hidePrice, hideAmount, hideContractSize, hidePriceTick
} = {}) {
    const description = ['place buy order'];
    if (!hideAmount) {
        description.push('of');
        description.push(String(maxAmount));
        description.push('or less contracts');
    }
    if (!hidePrice) {
        description.push('of');
        description.push(formatValue(price));
        description.push('or better');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push('for at most');
        description.push(String(maxPricePoints));
        description.push(`price point${maxPricePoints!=1?'s':''}`);
    }
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OperatorPlaceSellOrderScenario, function({
    maxAmount, price, maxPricePoints, setupActions, contractSize, priceTick
}, {
    hidePrice, hideAmount, hideContractSize, hidePriceTick
} = {}) {
    const description = ['place sell order'];
    if (!hideAmount) {
        description.push('of');
        description.push(String(maxAmount));
        description.push('or less contracts');
    }
    if (!hidePrice) {
        description.push('of');
        description.push(formatValue(price));
        description.push('or better');
    }
    if (maxPricePoints != MAX_UINT8) {
        description.push('for at most');
        description.push(String(maxPricePoints));
        description.push(`price point${maxPricePoints!=1?'s':''}`);
    }
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OperatorClaimOrderScenario, function({
    orderType, price, orderId, maxAmount, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideOrderId, hideAmount, hideContractSize, hidePriceTick
} = {}) {
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
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OperatorTransferOrderScenario, function({
    orderType, price, orderId, recipient, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideOrderId, hideContractSize, hidePriceTick
} = {}) {
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
    description.push(`to ${recipient}`);
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});

describer.addDescriber(OperatorCancelOrderScenario, function({
    orderType, price, orderId, setupActions, contractSize, priceTick
}, {
    hidePrice, hideOrderType, hideOrderId, hideContractSize, hidePriceTick
} = {}) {
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
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    if (!hideContractSize || !hidePriceTick) {
        description.push('with');
    }
    if (!hideContractSize) {
        description.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hideContractSize && !hidePriceTick) {
        description.push('and');
    }
    if (!hidePriceTick) {
        description.push(`price tick at ${formatValue(priceTick)}`);
    }
    return description.join(' ');
});
