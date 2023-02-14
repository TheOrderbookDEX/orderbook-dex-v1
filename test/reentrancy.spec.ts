import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { range } from '@frugal-wizard/contract-test-helper';
import { reentrancyScenarios } from './scenarios/reentrancy';
import { OrderType } from './state/OrderType';
import { Order, PricePoint } from '../src/OrderbookV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('reentrancy', () => {
    for (const [ description, scenarios ] of Object.entries(reentrancyScenarios)) {
        describe(description, () => {
            for (const scenario of scenarios) {
                scenario.describe(({ it }) => {
                    it('should not leave the contract in an invalid state', async (test) => {
                        try {
                            await test.executeStatic();
                        } catch (error) {
                            expect(scenario.expectedErrors)
                                .to.deep.include(error);
                            return;
                        }

                        await test.execute();

                        const { contractSize } = scenario;
                        const { orderbook, addressBook, tradedToken, baseToken } = test;
                        for (const orders of scenario.possibleOrdersAfter) {
                            try {
                                expect(await tradedToken.balanceOf(orderbook.address))
                                    .to.be.equal(orders.tradedTokenBalance * contractSize);
                                expect(await baseToken.balanceOf(orderbook.address))
                                    .to.be.equal(orders.baseTokenBalance);
                                expect(await orderbook.askPrice())
                                    .to.be.equal(orders.askPrice);
                                expect(await orderbook.bidPrice())
                                    .to.be.equal(orders.bidPrice);
                                for (const price of orders.sellPrices) {
                                    expect(await orderbook.nextSellPrice(price))
                                        .to.be.equal(orders.nextSellPrice(price));
                                }
                                for (const price of orders.buyPrices) {
                                    expect(await orderbook.nextBuyPrice(price))
                                        .to.be.equal(orders.nextBuyPrice(price));
                                }
                                for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
                                    for (const price of orders.prices(orderType)) {
                                        const lastOrderId = orders.lastOrderId(orderType, price);
                                        const lastActualOrderId = orders.lastActualOrderId(orderType, price);
                                        const totalPlaced = orders.totalPlaced(orderType, price);
                                        const totalFilled = orders.totalFilled(orderType, price);
                                        const pricePoint = new PricePoint(lastOrderId, lastActualOrderId, totalPlaced, totalFilled);
                                        expect(await orderbook.pricePoint(orderType, price))
                                            .to.be.deep.equal(pricePoint);
                                        for (const orderId of range(1n, lastOrderId)) {
                                            const order = orders.get(orderType, price, orderId);
                                            if (!order) continue;
                                            const { owner, amount, claimed, deleted } = order;
                                            const ownerId = await addressBook.id(test[owner]);
                                            const totalPlacedBeforeOrder = orders.totalPlacedBeforeOrder(orderType, price, orderId);
                                            const prevOrderId = orders.prevOrderId(orderType, price, orderId);
                                            const nextOrderId = orders.nextOrderId(orderType, price, orderId);
                                            expect(await orderbook.order(orderType, price, orderId))
                                                .to.be.deep.equal(deleted ?
                                                    new Order(0n, 0n, 0n, 0n, 0n, 0n) :
                                                    new Order(ownerId, amount, claimed, totalPlacedBeforeOrder, prevOrderId, nextOrderId));
                                        }
                                    }
                                }
                                return;

                            } catch (error) {
                                continue;
                            }
                        }
                        throw new Error('contract left in an invalid state');
                    });
                });
            }
        });
    }
});
