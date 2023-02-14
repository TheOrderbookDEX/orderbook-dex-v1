import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { is } from '@frugal-wizard/contract-test-helper';
import { placeOrderScenarios } from './scenarios/placeOrder';
import { Placed } from '../src/OrderbookV1';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

// TODO test overflows/underflows

describe('placeOrder', () => {
    for (const [ description, scenarios ] of Object.entries(placeOrderScenarios)) {
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
                        it(`should decrease ${scenario.takenToken} balance of sender accordingly`, async (test) => {
                            const { takenAmount } = scenario;
                            const { mainAccount, [scenario.takenToken]: takenToken } = test;
                            const expected = await takenToken.balanceOf(mainAccount) - takenAmount;
                            await test.execute();
                            expect(await takenToken.balanceOf(mainAccount))
                                .to.be.equal(expected);
                        });

                        it(`should increase ${scenario.takenToken} balance of contract accordingly`, async (test) => {
                            const { takenAmount } = scenario;
                            const { orderbook, [scenario.takenToken]: takenToken } = test;
                            const expected = await takenToken.balanceOf(orderbook) + takenAmount;
                            await test.execute();
                            expect(await takenToken.balanceOf(orderbook))
                                .to.be.equal(expected);
                        });

                        it('should increase total placed contracts accordingly', async (test) => {
                            const { amount, orderType, price } = scenario;
                            const { orderbook } = test;
                            const expected = (await orderbook.pricePoint(orderType, price)).totalPlaced + amount;
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

                        it('should update last order id', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const expected = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            await test.execute();
                            expect((await orderbook.pricePoint(orderType, price)).lastOrderId)
                                .to.be.equal(expected);
                        });

                        it('should update last actual order id', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const expected = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            await test.execute();
                            expect((await orderbook.pricePoint(orderType, price)).lastActualOrderId)
                                .to.be.equal(expected);
                        });

                        it('should return the id of the created order', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const expected = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            expect(await test.executeStatic())
                                .to.be.equal(expected);
                        });

                        it('should create an order with sender as owner', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook, addressBook, mainAccount } = test;
                            const orderId = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            const expected = await addressBook.id(mainAccount);
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).owner)
                                .to.be.equal(expected);
                        });

                        it('should create an order with provided amount', async (test) => {
                            const { orderType, price, amount } = scenario;
                            const { orderbook } = test;
                            const orderId = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).amount)
                                .to.be.equal(amount);
                        });

                        it('should create an order with zero claimed', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const orderId = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).claimed)
                                .to.be.equal(0n);
                        });

                        it('should create an order with the correct total placed before order', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const orderId = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            const expected = (await orderbook.pricePoint(orderType, price)).totalPlaced;
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).totalPlacedBeforeOrder)
                                .to.be.equal(expected);
                        });

                        it('should create an order with the correct previous order id', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const orderId = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            const expected = (await orderbook.pricePoint(orderType, price)).lastActualOrderId;
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).prevOrderId)
                                .to.be.equal(expected);
                        });

                        it('should create an order with no next order id', async (test) => {
                            const { orderType, price } = scenario;
                            const { orderbook } = test;
                            const orderId = (await orderbook.pricePoint(orderType, price)).lastOrderId + 1n;
                            await test.execute();
                            expect((await orderbook.order(orderType, price, orderId)).nextOrderId)
                                .to.be.equal(0n);
                        });

                        if (scenario.addsSellPrice) {
                            it('should add a new sell price', async (test) => {
                                const { price, prevPrice, nextPrice } = scenario;
                                const { orderbook } = test;
                                await test.execute();
                                expect(prevPrice ? await orderbook.nextSellPrice(prevPrice) : await orderbook.askPrice())
                                    .to.be.equal(price);
                                expect(await orderbook.nextSellPrice(price))
                                    .to.be.equal(nextPrice);
                            });
                        }

                        if (scenario.addsBuyPrice) {
                            it('should add a new buy price', async (test) => {
                                const { price, prevPrice, nextPrice } = scenario;
                                const { orderbook } = test;
                                await test.execute();
                                expect(prevPrice ? await orderbook.nextBuyPrice(prevPrice) : await orderbook.bidPrice())
                                    .to.be.equal(price);
                                expect(await orderbook.nextBuyPrice(price))
                                    .to.be.equal(nextPrice);
                            });
                        }

                        it('should emit Placed', async (test) => {
                            const { orderType, price, amount } = scenario;
                            const { events } = await test.execute();
                            const orderPlacedEvents = events.filter(is(Placed));
                            expect(orderPlacedEvents)
                                .to.have.length(1);
                            expect(orderPlacedEvents[0].orderType)
                                .to.be.equal(orderType);
                            expect(orderPlacedEvents[0].price)
                                .to.be.equal(price);
                            expect(orderPlacedEvents[0].amount)
                                .to.be.equal(amount);
                        });
                    }
                });
            }
        });
    }
});
