import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { describeError, is, range } from '@frugal-wizard/contract-test-helper';
import { deployOrderbookScenarios } from './scenarios/DeployOrderbook';
import { placeOrderScenarios } from './scenarios/PlaceOrder';
import { fillScenarios } from './scenarios/Fill';
import { claimOrderScenarios } from './scenarios/ClaimOrder';
import { cancelOrderScenarios } from './scenarios/CancelOrder';
import { Canceled, Filled, Order, Placed, PricePoint } from '../src/OrderbookV1';
import { transferOrderScenarios } from './scenarios/TransferOrder';
import { reentrancyScenarios } from './scenarios/Reentrancy';
import { OrderType } from './state/OrderType';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

// TODO test overflows/underflows

describe('OrderbookV1', () => {
    describe('deploy', () => {
        for (const scenario of deployOrderbookScenarios) {
            scenario.describe(({ it }) => {
                if (scenario.expectedError) {
                    it('should fail', async (test) => {
                        await expect(test.execute())
                            .to.be.rejected;
                    });

                    it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                        await expect(test.executeStatic())
                            .to.be.rejectedWith(scenario.expectedError as typeof Error);
                    });

                } else {
                    it('should deploy with the provided treasury contract', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.treasury())
                            .to.be.equal(test.treasury.address);
                    });

                    it('should deploy with the provided address book contract', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.addressBook())
                            .to.be.equal(test.addressBook.address);
                    });

                    it('should deploy with the provided traded token', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.tradedToken())
                            .to.be.equal(test.tradedToken.address);
                    });

                    it('should deploy with the provided base token', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.baseToken())
                            .to.be.equal(test.baseToken.address);
                    });

                    it('should deploy with the provided contract size', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.contractSize())
                            .to.be.equal(scenario.contractSize);
                    });

                    it('should deploy with the provided price tick', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.priceTick())
                            .to.be.equal(scenario.priceTick);
                    });

                    it('should deploy with ask price at zero', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.askPrice())
                            .to.be.equal(0n);
                    });

                    it('should deploy with bid price at zero', async (test) => {
                        const orderbook = await test.execute();
                        expect(await orderbook.askPrice())
                            .to.be.equal(0n);
                    });
                }
            });
        }
    });

    describe('placeOrder', () => {
        for (const [ description, scenarios ] of placeOrderScenarios) {
            describe(description, () => {
                for (const scenario of scenarios) {
                    scenario.describe(({ it }) => {
                        if (scenario.expectedError) {
                            it('should fail', async (test) => {
                                await expect(test.execute())
                                    .to.be.rejected;
                            });

                            it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                                await expect(test.executeStatic())
                                    .to.be.rejectedWith(scenario.expectedError as typeof Error);
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

    describe('fill', () => {
        for (const [ description, scenarios ] of fillScenarios) {
            describe(description, () => {
                for (const scenario of scenarios) {
                    scenario.describe(({ it }) => {
                        if (scenario.expectedError) {
                            it('should fail', async (test) => {
                                await expect(test.execute())
                                    .to.be.rejected;
                            });

                            it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                                await expect(test.executeStatic())
                                    .to.be.rejectedWith(scenario.expectedError as typeof Error);
                            });

                        } else {
                            it('should return the amount of contracts filled', async (test) => {
                                const [ totalFilled ] = await test.executeStatic();
                                expect(totalFilled)
                                    .to.be.equal(scenario.totalFilled);
                            });

                            it('should return the total price of the contracts filled', async (test) => {
                                const [ , totalPrice ] = await test.executeStatic();
                                expect(totalPrice)
                                    .to.be.equal(scenario.totalPrice);
                            });

                            it('should return the fee collected', async (test) => {
                                const [ , , fee ] = await test.executeStatic();
                                expect(fee)
                                    .to.be.equal(scenario.collectedFee);
                            });

                            it(`should decrease ${scenario.takenToken} balance of caller accordingly`, async (test) => {
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

                            it(`should decrease ${scenario.givenToken} balance of contract accordingly`, async (test) => {
                                const { givenAmount, collectedFee } = scenario;
                                const { orderbook, [scenario.givenToken]: givenToken } = test;
                                const expected = await givenToken.balanceOf(orderbook) - (givenAmount - collectedFee);
                                await test.execute();
                                expect(await givenToken.balanceOf(orderbook))
                                    .to.be.equal(expected);
                            });

                            it(`should increase ${scenario.givenToken} balance of caller accordingly`, async (test) => {
                                const { givenAmount, collectedFee } = scenario;
                                const { mainAccount, [scenario.givenToken]: givenToken } = test;
                                const expected = await givenToken.balanceOf(mainAccount) + (givenAmount - collectedFee);
                                await test.execute();
                                expect(await givenToken.balanceOf(mainAccount))
                                    .to.be.equal(expected);
                            });

                            it(`should increase collected fees accordingly`, async (test) => {
                                const { givenToken, collectedFee } = scenario;
                                const { orderbook } = test;
                                let [ collectedTradedToken, collectedBaseToken ] = await orderbook.collectedFees();
                                switch (givenToken) {
                                    case 'tradedToken':
                                        collectedTradedToken += collectedFee;
                                        break;
                                    case 'baseToken':
                                        collectedBaseToken += collectedFee;
                                        break;
                                }
                                await test.execute();
                                expect(await orderbook.collectedFees())
                                    .to.be.deep.equal([ collectedTradedToken, collectedBaseToken ]);
                            });

                            it('should not change total placed contracts', async (test) => {
                                const { orderType, filledAmounts } = scenario;
                                const { orderbook } = test;
                                const expected = new Map();
                                for (const price of filledAmounts.keys()) {
                                    expected.set(price, (await orderbook.pricePoint(orderType, price)).totalPlaced);
                                }
                                await test.execute();
                                for (const [ price, amount ] of expected.entries()) {
                                    expect((await orderbook.pricePoint(orderType, price)).totalPlaced)
                                        .to.be.equal(amount);
                                }
                            });

                            it('should increase total filled contracts accordingly', async (test) => {
                                const { orderType, filledAmounts } = scenario;
                                const { orderbook } = test;
                                const expected = new Map();
                                for (const [ price, amount ] of filledAmounts.entries()) {
                                    expected.set(price, (await orderbook.pricePoint(orderType, price)).totalFilled + amount);
                                }
                                await test.execute();
                                for (const [ price, amount ] of expected.entries()) {
                                    expect((await orderbook.pricePoint(orderType, price)).totalFilled)
                                        .to.be.equal(amount);
                                }
                            });

                            it(`should update ${scenario.bestPrice} accordingly`, async (test) => {
                                await test.execute();
                                const { orderbook } = test;
                                expect(await orderbook[scenario.bestPrice]())
                                    .to.be.equal(scenario.expectedBestPrice);
                            });

                            it('should emit Filled', async (test) => {
                                const { orderType, filledAmounts } = scenario;
                                const { events } = await test.execute();
                                const filledEvents = events.filter(is(Filled));
                                expect(filledEvents)
                                    .to.have.length(filledAmounts.size);
                                expect(filledEvents.map(({ price }) => price))
                                    .to.have.members([...filledAmounts.keys()])
                                for (const event of filledEvents) {
                                    expect(event.orderType)
                                        .to.be.equal(orderType);
                                    expect(event.amount)
                                        .to.be.equal(filledAmounts.get(event.price));
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    describe('claimOrder', () => {
        for (const [ description, scenarios ] of claimOrderScenarios) {
            describe(description, () => {
                for (const scenario of scenarios) {
                    scenario.describe(({ it }) => {
                        if (scenario.expectedError) {
                            it('should fail', async (test) => {
                                await expect(test.execute())
                                    .to.be.rejected;
                            });

                            it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                                await expect(test.executeStatic())
                                    .to.be.rejectedWith(scenario.expectedError as typeof Error);
                            });

                        } else {
                            it('should return the amount of contracts claimed', async (test) => {
                                const [ amountClaimed ] = await test.executeStatic();
                                expect(amountClaimed)
                                    .to.be.equal(scenario.amountClaimed);
                            });

                            it('should return the fee collected', async (test) => {
                                const [ , fee ] = await test.executeStatic();
                                expect(fee)
                                    .to.be.equal(scenario.collectedFee);
                            });

                            it(`should decrease ${scenario.givenToken} balance of contract accordingly`, async (test) => {
                                const { givenAmount, collectedFee } = scenario;
                                const { orderbook, [scenario.givenToken]: givenToken } = test;
                                const expected = await givenToken.balanceOf(orderbook) - (givenAmount - collectedFee);
                                await test.execute();
                                expect(await givenToken.balanceOf(orderbook))
                                    .to.be.equal(expected);
                            });

                            it(`should increase ${scenario.givenToken} balance of sender accordingly`, async (test) => {
                                const { givenAmount, collectedFee } = scenario;
                                const { mainAccount, [scenario.givenToken]: givenToken } = test;
                                const expected = await givenToken.balanceOf(mainAccount) + (givenAmount - collectedFee);
                                await test.execute();
                                expect(await givenToken.balanceOf(mainAccount))
                                    .to.be.equal(expected);
                            });

                            it(`should increase collected fees accordingly`, async (test) => {
                                const { givenToken, collectedFee } = scenario;
                                const { orderbook } = test;
                                let [ collectedTradedToken, collectedBaseToken ] = await orderbook.collectedFees();
                                switch (givenToken) {
                                    case 'tradedToken':
                                        collectedTradedToken += collectedFee;
                                        break;
                                    case 'baseToken':
                                        collectedBaseToken += collectedFee;
                                        break;
                                }
                                await test.execute();
                                expect(await orderbook.collectedFees())
                                    .to.be.deep.equal([ collectedTradedToken, collectedBaseToken ]);
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
                                it('should update claimed amount', async (test) => {
                                    const { orderType, price, orderId, amountClaimed } = scenario;
                                    const { orderbook } = test;
                                    const expected = await orderbook.order(orderType, price, orderId);
                                    expected.claimed += amountClaimed;
                                    await test.execute();
                                    expect(await orderbook.order(orderType, price, orderId))
                                        .to.be.deep.equal(expected);
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    describe('cancelOrder', () => {
        for (const [ description, scenarios ] of cancelOrderScenarios) {
            describe(description, () => {
                for (const scenario of scenarios) {
                    scenario.describe(({ it }) => {
                        if (scenario.expectedError) {
                            it('should fail', async (test) => {
                                await expect(test.execute())
                                    .to.be.rejected;
                            });

                            it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                                await expect(test.executeStatic())
                                    .to.be.rejectedWith(scenario.expectedError as typeof Error);
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

    describe('transfer', () => {
        for (const [ description, scenarios ] of transferOrderScenarios) {
            describe(description, () => {
                for (const scenario of scenarios) {
                    scenario.describe(({ it }) => {
                        if (scenario.expectedError) {
                            it('should fail', async (test) => {
                                await expect(test.execute())
                                    .to.be.rejected;
                            });

                            it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                                await expect(test.executeStatic())
                                    .to.be.rejectedWith(scenario.expectedError as typeof Error);
                            });

                        } else {
                            it('should update the order owner', async (test) => {
                                const { orderType, price, orderId } = scenario;
                                const { orderbook, addressBook, [scenario.newOwner]: newOwner } = test;
                                await test.execute();
                                expect((await orderbook.order(orderType, price, orderId)).owner)
                                    .to.be.equal(await addressBook.id(newOwner));
                            });
                        }
                    });
                }
            });
        }
    });

    describe('reentrancy', () => {
        for (const [ description, scenarios ] of reentrancyScenarios) {
            describe(description, () => {
                for (const scenario of scenarios) {
                    scenario.describe(({ it }) => {
                        if (scenario.expectedError) {
                            it('should fail', async (test) => {
                                await expect(test.execute())
                                    .to.be.rejected;
                            });

                            it(`should fail with ${describeError(scenario.expectedError)}`, async (test) => {
                                await expect(test.executeStatic())
                                    .to.be.rejectedWith(scenario.expectedError as typeof Error);
                            });

                        } else {
                            it('should not leave the contract in an invalid state', async (test) => {
                                try {
                                    await test.executeStatic();
                                } catch (error) {
                                    for (const expectedError of scenario.expectedErrors) {
                                        try {
                                            expect(function () { throw error; })
                                                .to.throw(expectedError as typeof Error);
                                            return;
                                        } catch {
                                            continue;
                                        }
                                    }
                                    throw error;
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
                                                    const ownerId = await addressBook.id(test.getOwnerAddress(owner));
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
                                        console.error(error)
                                        continue;
                                    }
                                }
                                throw new Error('contract left in an invalid state');
                            });
                        }
                    });
                }
            });
        }
    });
});
