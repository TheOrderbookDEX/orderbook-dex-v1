import { formatValue, MAX_UINT256, MAX_UINT32, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { Account, ConfigurableDescriber } from '@frugal-wizard/contract-test-helper';
import { CancelOrderAction } from '../action/CancelOrder';
import { CancelOrderUsingPuppetAction } from '../action/CancelOrderUsingPuppet';
import { ClaimOrderAction } from '../action/ClaimOrder';
import { ClaimOrderUsingPuppetAction } from '../action/ClaimOrderUsingPuppet';
import { FillAction } from '../action/Fill';
import { FillUsingPuppetAction } from '../action/FillUsingPuppet';
import { PlaceOrderAction } from '../action/PlaceOrder';
import { PlaceOrderUsingPuppetAction } from '../action/PlaceOrderUsingPuppet';
import { DeployOrderbookScenario } from '../scenario/DeployOrderbook';
import { CancelOrderScenario } from '../scenario/CancelOrder';
import { ClaimOrderScenario } from '../scenario/ClaimOrder';
import { FillScenario } from '../scenario/Fill';
import { PlaceOrderScenario } from '../scenario/PlaceOrder';
import { ReentrancyScenario } from '../scenario/Reentrancy';
import { TransferOrderScenario } from '../scenario/TransferOrder';
import { describeOrderType, OrderType } from '../state/OrderType';
import { DeployOrderbookFactoryScenario } from '../scenario/DeployOrderbookFactory';
import { CreateOrderbookScenario } from '../scenario/CreateOrderbook';
import { CreateOrderbookAction } from '../action/CreateOrderbook';
import { ClaimFeesScenario } from '../scenario/ClaimFees';
import { ClaimFeesAction } from '../action/ClaimFees';

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

describer.addDescriber(ClaimFeesAction, function() {
    return 'claim fees';
});

describer.addDescriber(DeployOrderbookScenario, function({
    addressBookAddress, tradedTokenAddress, baseTokenAddress, fee, contractSize, priceTick
}, {
    hideContractSize, hidePriceTick
} = {}) {
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
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    return `deploy orderbook${ settings.length ? ` with ${ settings.join(' and ') }` : '' }`;
});

describer.addDescriber(PlaceOrderScenario, function({
    orderType, price, amount, setupActions, fee, contractSize, priceTick
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
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(FillScenario, function({
    orderType, maxAmount, maxPrice, maxPricePoints, setupActions, fee, contractSize, priceTick
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
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(ClaimOrderScenario, function({
    orderType, price, orderId, maxAmount, setupActions, fee, contractSize, priceTick
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
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(CancelOrderScenario, function({
    orderType, price, orderId, setupActions, fee, contractSize, priceTick
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
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(TransferOrderScenario, function({
    orderType, price, orderId, newOwner, setupActions, fee, contractSize, priceTick
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
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(ClaimFeesScenario, function({
    setupActions, fee, contractSize, priceTick
}, {
    hideContractSize, hidePriceTick
} = {}) {
    const description = ['claim fees'];
    for (const [ index, action ] of setupActions.entries()) {
        description.push(index == 0 ? 'after' : 'and');
        description.push(action.description);
    }
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(ReentrancyScenario, function({
    compromisedToken, mainAction, reentrantAction, setupActions, fee, contractSize, priceTick
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
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (!hideContractSize) {
        settings.push(`contract size at ${formatValue(contractSize)}`);
    }
    if (!hidePriceTick) {
        settings.push(`price tick at ${formatValue(priceTick)}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(DeployOrderbookFactoryScenario, function({
    fee, addressBookAddress
}) {
    const description = ['deploy factory'];
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
    }
    if (addressBookAddress) {
        settings.push(`addressBook at ${addressBookAddress}`);
    }
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(CreateOrderbookAction, function({
    tradedTokenAddress, baseTokenAddress, contractSize, priceTick
}, config = {}) {
    const description = ['create orderbook'];
    const settings = [];
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
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    return description.join(' ');
});

describer.addDescriber(CreateOrderbookScenario, function({
    fee, tradedTokenAddress, baseTokenAddress, contractSize, priceTick, setupActions
}, config = {}) {
    const description = ['create orderbook'];
    const settings = [];
    if (fee) {
        settings.push(`fee at ${formatValue(fee)}`);
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
    if (settings.length) {
        description.push('with');
        description.push(settings.join(' and '));
    }
    if (setupActions.length) {
        description.push('after');
        description.push(setupActions.map(({ description }) => description).join(' and '));
    }
    return description.join(' ');
});
