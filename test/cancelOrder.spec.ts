import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { is } from '@frugal-wizard/contract-test-helper';
import { cancelOrderScenarios } from './scenarios/cancelOrder';
import { Canceled, Order } from '../src/OrderbookV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

// TODO test overflows/underflows

describe('cancelOrder', () => {
    for (const [ description, scenarios ] of Object.entries(cancelOrderScenarios)) {
        describe(description, () => {
            for (const scenario of scenarios) {
                scenario.describe(({ it }) => {
                    if (scenario.expectedError) {
                        it('should fail', async (test) => {
                            await expect(test.execute())
                                .to.be.rejected;
                        });

                        it(`should fail with ${scenario.expectedError.name}`, async (test) => {
                            await expect(test.executeStatic())
                                .to.be.rejected.and.eventually.be.deep.equal(scenario.expectedError);
                        });

                    } else {
                        it('should return the amount of contracts canceled', async (test) => {
                            const amountCanceled = await test.executeStatic();
                            expect(amountCanceled)
                                .to.be.equal(scenario.amountCanceled);
                        });

                        it(`should decrease ${scenario.givenToken} balance of contract accordingly`, async (test) => {
                            const { givenAmount } = scenario;
                            const { orderbook, [scenario.givenToken]: givenToken } = test;
                            const expected = await givenToken.balanceOf(orderbook) - givenAmount;
                            await test.execute();
                            expect(await givenToken.balanceOf(orderbook))
                                .to.be.equal(expected);
                        });

                        it(`should increase ${scenario.givenToken} balance of sender accordingly`, async (test) => {
                            const { givenAmount } = scenario;
                            const { mainAccount, [scenario.givenToken]: givenToken } = test;
                            const expected = await givenToken.balanceOf(mainAccount) + givenAmount;
                            await test.execute();
                            expect(await givenToken.balanceOf(mainAccount))
                                .to.be.equal(expected);
                        });

                        it('should decrease total placed contracts accordingly', async (test) => {
                            const { orderType, price, amountCanceled } = scenario;
                            const { orderbook } = test;
                            const expected = (await orderbook.pricePoint(orderType, price)).totalPlaced - amountCanceled;
                            await test.execute();
                            expect((await orderbook.pricePoint(orderType, price)).totalPlaced)
                                .to.be.equal(expected);
                        });

                        it('should not change total filled contracts', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const expected = (await orderbook.pricePoint(orderType, price)).totalFilled;
                            await test.execute();
                            expect((await orderbook.pricePoint(orderType, price)).totalFilled)
                                .to.be.equal(expected);
                        });

                        if (scenario.deletesOrder) {
                            it('should delete order', async (test) => {
                                const { orderType, price, orderId } = scenario;
                                const { orderbook } = test;
                                await test.execute();
                                expect(await orderbook.order(orderType, price, orderId))
                                    .to.be.deep.equal(new Order(0n, 0n, 0n, 0n, 0n, 0n));
                            });

                            if (scenario.prevOrderId) {
                                it('should update prev order\'s next order id', async (test) => {
                                    const { orderType, price, prevOrderId, nextOrderId } = scenario;
                                    const { orderbook } = test;
                                    await test.execute();
                                    expect((await orderbook.order(orderType, price, prevOrderId)).nextOrderId)
                                        .to.be.equal(nextOrderId);
                                });
                            }

                            if (scenario.nextOrderId) {
                                it('should update next order\'s prev order id', async (test) => {
                                    const { orderType, price, prevOrderId, nextOrderId } = scenario;
                                    const { orderbook } = test;
                                    await test.execute();
                                    expect((await orderbook.order(orderType, price, nextOrderId)).prevOrderId)
                                        .to.be.equal(prevOrderId);
                                });
                            }

                            if (scenario.updatesLastActualOrderId) {
                                it('should update last actual order id of price point', async (test) => {
                                    const { orderType, price, prevOrderId } = scenario;
                                    const { orderbook } = test;
                                    await test.execute();
                                    expect((await orderbook.pricePoint(orderType, price)).lastActualOrderId)
                                        .to.be.equal(prevOrderId);
                                });
                            }

                        } else {
                            it('should update order amount', async (test) => {
                                const { orderType, price, orderId, amountCanceled } = scenario;
                                const { orderbook } = test;
                                const expected = (await orderbook.order(orderType, price, orderId)).amount - amountCanceled;
                                await test.execute();
                                expect((await orderbook.order(orderType, price, orderId)).amount)
                                    .to.be.equal(expected);
                            });
                        }

                        it('should update total placed before of following orders', async (test) => {
                            const { orderType, price, orderId, amountCanceled } = scenario;
                            const { orderbook } = test;
                            const lastOrderId = (await orderbook.pricePoint(orderType, price)).lastOrderId;
                            const expectedMap = new Map();
                            for (let id = orderId + 1n; id <= lastOrderId; id++) {
                                const order = await orderbook.order(orderType, price, id);
                                if (!order.owner) continue;
                                expectedMap.set(id, order.totalPlacedBeforeOrder - amountCanceled);
                            }
                            await test.execute();
                            for (const [ id, expected ] of expectedMap) {
                                expect((await orderbook.order(orderType, price, id)).totalPlacedBeforeOrder)
                                    .to.be.equal(expected);
                            }
                        });

                        if (scenario.removesSellPrice) {
                            it('should remove the sell price', async (test) => {
                                const { prevPrice, nextPrice } = scenario;
                                const { orderbook } = test;
                                await test.execute();
                                expect(prevPrice ? await orderbook.nextSellPrice(prevPrice) : await orderbook.askPrice())
                                    .to.be.equal(nextPrice);
                            });
                        }

                        if (scenario.removesBuyPrice) {
                            it('should remove the buy price', async (test) => {
                                const { prevPrice, nextPrice } = scenario;
                                const { orderbook } = test;
                                await test.execute();
                                expect(prevPrice ? await orderbook.nextBuyPrice(prevPrice) : await orderbook.bidPrice())
                                    .to.be.equal(nextPrice);
                            });
                        }

                        it('should emit Canceled', async (test) => {
                            const { orderType, price, amountCanceled } = scenario;
                            const { events } = await test.execute();
                            const orderCanceledEvents = events.filter(is(Canceled));
                            expect(orderCanceledEvents)
                                .to.have.length(1);
                            expect(orderCanceledEvents[0].orderType)
                                .to.be.equal(orderType);
                            expect(orderCanceledEvents[0].price)
                                .to.be.equal(price);
                            expect(orderCanceledEvents[0].amount)
                                .to.be.equal(amountCanceled);
                        });
                    }
                });
            }
        });
    }
});
