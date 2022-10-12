import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describeError, is } from '@frugal-wizard/contract-test-helper';
import { BoughtAtMarket, Failed, OrderCanceled, OrderClaimed, OrderTransfered, PlacedBuyOrder, PlacedSellOrder, SoldAtMarket } from '../src/OperatorLogicV1';
import { operatorBuyAtMarketScenarios } from './scenarios/operatorBuyAtMarketScenarios';
import { operatorCancelOrderScenarios } from './scenarios/operatorCancelOrderScenarios';
import { operatorClaimOrderScenarios } from './scenarios/operatorClaimOrderScenarios';
import { operatorPlaceBuyOrderScenarios } from './scenarios/operatorPlaceBuyOrderScenarios';
import { operatorPlaceSellOrderScenarios } from './scenarios/operatorPlaceSellOrderScenarios';
import { operatorSellAtMarketScenarios } from './scenarios/operatorSellAtMarketScenarios';
import { operatorTransferOrderScenarios } from './scenarios/operatorTransferOrderScenarios';
import { OrderType } from './state/OrderType';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('OperatorLogicV1', () => {
    describe('buyAtMarket', () => {
        for (const [ description, scenarios ] of operatorBuyAtMarketScenarios) {
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

                        } else if (scenario.expectedErrorInResult) {
                            const error = scenario.expectedErrorInResult;

                            it('should mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.true;
                            });

                            it('should return error', async (test) => {
                                expect((await test.executeStatic()).error)
                                    .to.be.equal(error.encode());
                            });

                            it('should emit a Failed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(Failed));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].error)
                                    .to.be.equal(error.encode());
                            });

                            it('should not take baseToken from operator', async (test) => {
                                const { baseToken, operator } = test;
                                const prevBalance = await baseToken.balanceOf(operator);
                                await test.execute();
                                expect(await baseToken.balanceOf(operator))
                                    .to.be.equal(prevBalance);
                            });

                            it('should not take tradedTaken from orderbook', async (test) => {
                                const { tradedToken, orderbook } = test;
                                const prevBalance = await tradedToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await tradedToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance);
                            });

                            it('should leave baseToken allowance at 0', async (test) => {
                                const { baseToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await baseToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });

                        } else {
                            it('should return amount bought', async (test) => {
                                expect((await test.executeStatic()).amountBought)
                                    .to.be.equal(scenario.amountBought);
                            });

                            it('should return amount paid', async (test) => {
                                expect((await test.executeStatic()).amountPaid)
                                    .to.be.equal(scenario.amountPaid);
                            });

                            it('should not mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.false;
                            });

                            if (scenario.amountBought) {
                                it('should emit a BoughtAtMarket event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(BoughtAtMarket));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amountBought)
                                        .to.be.equal(scenario.amountBought);
                                    expect(events[0].amountPaid)
                                        .to.be.equal(scenario.amountPaid);
                                });
                            }

                            it('should take the corresponding baseToken from operator', async (test) => {
                                const { baseToken, operator } = test;
                                const { amountPaid } = scenario;
                                const prevBalance = await baseToken.balanceOf(operator);
                                await test.execute();
                                expect(await baseToken.balanceOf(operator))
                                    .to.be.equal(prevBalance - amountPaid);
                            });

                            it('should give the corresponding baseToken to orderbook', async (test) => {
                                const { baseToken, orderbook } = test;
                                const { amountPaid } = scenario;
                                const prevBalance = await baseToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await baseToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance + amountPaid);
                            });

                            it('should take the corresponding tradedTaken from orderbook', async (test) => {
                                const { tradedToken, orderbook } = test;
                                const { amountBought } = scenario;
                                const prevBalance = await tradedToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await tradedToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance - amountBought * await orderbook.contractSize());
                            });

                            it('should give the corresponding tradedTaken to operator', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                const { amountBought } = scenario;
                                const prevBalance = await tradedToken.balanceOf(operator);
                                await test.execute();
                                expect(await tradedToken.balanceOf(operator))
                                    .to.be.equal(prevBalance + amountBought * await orderbook.contractSize());
                            });

                            it('should leave baseToken allowance at 0', async (test) => {
                                const { baseToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await baseToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });
                        }
                    });
                }
            });
        }
    });

    describe('sellAtMarket', () => {
        for (const [ description, scenarios ] of operatorSellAtMarketScenarios) {
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

                        } else if (scenario.expectedErrorInResult) {
                            const error = scenario.expectedErrorInResult;

                            it('should mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.true;
                            });

                            it('should return error', async (test) => {
                                expect((await test.executeStatic()).error)
                                    .to.be.equal(error.encode());
                            });

                            it('should emit a Failed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(Failed));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].error)
                                    .to.be.equal(error.encode());
                            });

                            it('should not take tradedToken from operator', async (test) => {
                                const { tradedToken, operator } = test;
                                const prevBalance = await tradedToken.balanceOf(operator);
                                await test.execute();
                                expect(await tradedToken.balanceOf(operator))
                                    .to.be.equal(prevBalance);
                            });

                            it('should not take baseToken from orderbook', async (test) => {
                                const { baseToken, orderbook } = test;
                                const prevBalance = await baseToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await baseToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance);
                            });

                            it('should leave tradedToken allowance at 0', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await tradedToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });

                        } else {
                            it('should return amount sold', async (test) => {
                                expect((await test.executeStatic()).amountSold)
                                    .to.be.equal(scenario.amountSold);
                            });

                            it('should return amount received', async (test) => {
                                expect((await test.executeStatic()).amountReceived)
                                    .to.be.equal(scenario.amountReceived);
                            });

                            it('should not mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.false;
                            });

                            if (scenario.amountSold) {
                                it('should emit a SoldAtMarket event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(SoldAtMarket));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amountSold)
                                        .to.be.equal(scenario.amountSold);
                                    expect(events[0].amountReceived)
                                        .to.be.equal(scenario.amountReceived);
                                });
                            }

                            it('should take the corresponding tradedToken from operator', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                const { amountSold } = scenario;
                                const prevBalance = await tradedToken.balanceOf(operator);
                                await test.execute();
                                expect(await tradedToken.balanceOf(operator))
                                    .to.be.equal(prevBalance - amountSold * await orderbook.contractSize());
                            });

                            it('should give the corresponding tradedToken to orderbook', async (test) => {
                                const { tradedToken, orderbook } = test;
                                const { amountSold } = scenario;
                                const prevBalance = await tradedToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await tradedToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance + amountSold * await orderbook.contractSize());
                            });

                            it('should take the corresponding baseToken from orderbook', async (test) => {
                                const { baseToken, orderbook } = test;
                                const { amountReceived } = scenario;
                                const prevBalance = await baseToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await baseToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance - amountReceived);
                            });

                            it('should give the corresponding baseToken to operator', async (test) => {
                                const { baseToken, operator } = test;
                                const { amountReceived } = scenario;
                                const prevBalance = await baseToken.balanceOf(operator);
                                await test.execute();
                                expect(await baseToken.balanceOf(operator))
                                    .to.be.equal(prevBalance + amountReceived);
                            });

                            it('should leave tradedToken allowance at 0', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await tradedToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });
                        }
                    });
                }
            });
        }
    });

    describe('placeBuyOrder', () => {
        for (const [ description, scenarios ] of operatorPlaceBuyOrderScenarios) {
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

                        } else if (scenario.expectedErrorInResult) {
                            const error = scenario.expectedErrorInResult;

                            it('should mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.true;
                            });

                            it('should return error', async (test) => {
                                expect((await test.executeStatic()).error)
                                    .to.be.equal(error.encode());
                            });

                            it('should emit a Failed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(Failed));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].error)
                                    .to.be.equal(error.encode());
                            });

                            it('should not take baseToken from operator', async (test) => {
                                const { baseToken, operator } = test;
                                const prevBalance = await baseToken.balanceOf(operator);
                                await test.execute();
                                expect(await baseToken.balanceOf(operator))
                                    .to.be.equal(prevBalance);
                            });

                            it('should not take tradedTaken from orderbook', async (test) => {
                                const { tradedToken, orderbook } = test;
                                const prevBalance = await tradedToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await tradedToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance);
                            });

                            it('should leave baseToken allowance at 0', async (test) => {
                                const { baseToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await baseToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });

                        } else {
                            it('should return amount bought', async (test) => {
                                expect((await test.executeStatic()).amountBought)
                                    .to.be.equal(scenario.amountBought);
                            });

                            it('should return amount paid', async (test) => {
                                expect((await test.executeStatic()).amountPaid)
                                    .to.be.equal(scenario.amountPaid);
                            });

                            it('should return amount placed', async (test) => {
                                expect((await test.executeStatic()).amountPlaced)
                                    .to.be.equal(scenario.amountPlaced);
                            });

                            it('should return order id', async (test) => {
                                expect((await test.executeStatic()).orderId)
                                    .to.be.equal(scenario.orderId);
                            });

                            it('should not mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.false;
                            });

                            if (scenario.amountBought) {
                                it('should emit a BoughtAtMarket event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(BoughtAtMarket));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amountBought)
                                        .to.be.equal(scenario.amountBought);
                                    expect(events[0].amountPaid)
                                        .to.be.equal(scenario.amountPaid);
                                });
                            }

                            if (scenario.amountPlaced) {
                                it('should emit a PlacedBuyOrder event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(PlacedBuyOrder));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amount)
                                        .to.be.equal(scenario.amountPlaced);
                                    expect(events[0].orderId)
                                        .to.be.equal(scenario.orderId);
                                });

                                it('should create an order for the amount placed', async (test) => {
                                    const { orderbook, addressBook, operator } = test;
                                    const { price, amountPlaced, actualOrderId } = scenario;
                                    await test.execute();
                                    const order = await orderbook.order(OrderType.BUY, price, actualOrderId);
                                    expect(order.amount)
                                        .to.be.equal(amountPlaced);
                                    expect(await addressBook.addr(order.owner))
                                        .to.be.equal(operator.address);
                                });
                            }

                            it('should take the corresponding baseToken from operator', async (test) => {
                                const { baseToken, operator } = test;
                                const { amountPaid, amountPlaced } = scenario;
                                const prevBalance = await baseToken.balanceOf(operator);
                                await test.execute();
                                expect(await baseToken.balanceOf(operator))
                                    .to.be.equal(prevBalance - (amountPaid + amountPlaced * scenario.price));
                            });

                            it('should give the corresponding baseToken to orderbook', async (test) => {
                                const { baseToken, orderbook } = test;
                                const { amountPaid, amountPlaced } = scenario;
                                const prevBalance = await baseToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await baseToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance + (amountPaid + amountPlaced * scenario.price));
                            });

                            it('should take the corresponding tradedTaken from orderbook', async (test) => {
                                const { tradedToken, orderbook } = test;
                                const { amountBought } = scenario;
                                const prevBalance = await tradedToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await tradedToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance - amountBought * await orderbook.contractSize());
                            });

                            it('should give the corresponding tradedTaken to operator', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                const { amountBought } = scenario;
                                const prevBalance = await tradedToken.balanceOf(operator);
                                await test.execute();
                                expect(await tradedToken.balanceOf(operator))
                                    .to.be.equal(prevBalance + amountBought * await orderbook.contractSize());
                            });

                            it('should leave baseToken allowance at 0', async (test) => {
                                const { baseToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await baseToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });
                        }
                    });
                }
            });
        }
    });

    describe('placeSellOrder', () => {
        for (const [ description, scenarios ] of operatorPlaceSellOrderScenarios) {
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

                        } else if (scenario.expectedErrorInResult) {
                            const error = scenario.expectedErrorInResult;

                            it('should mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.true;
                            });

                            it('should return error', async (test) => {
                                expect((await test.executeStatic()).error)
                                    .to.be.equal(error.encode());
                            });

                            it('should emit a Failed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(Failed));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].error)
                                    .to.be.equal(error.encode());
                            });

                            it('should not take tradedToken from operator', async (test) => {
                                const { tradedToken, operator } = test;
                                const prevBalance = await tradedToken.balanceOf(operator);
                                await test.execute();
                                expect(await tradedToken.balanceOf(operator))
                                    .to.be.equal(prevBalance);
                            });

                            it('should not take baseToken from orderbook', async (test) => {
                                const { baseToken, orderbook } = test;
                                const prevBalance = await baseToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await baseToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance);
                            });

                            it('should leave tradedToken allowance at 0', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await tradedToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });

                        } else {
                            it('should return amount sold', async (test) => {
                                expect((await test.executeStatic()).amountSold)
                                    .to.be.equal(scenario.amountSold);
                            });

                            it('should return amount received', async (test) => {
                                expect((await test.executeStatic()).amountReceived)
                                    .to.be.equal(scenario.amountReceived);
                            });

                            it('should return amount placed', async (test) => {
                                expect((await test.executeStatic()).amountPlaced)
                                    .to.be.equal(scenario.amountPlaced);
                            });

                            it('should return order id', async (test) => {
                                expect((await test.executeStatic()).orderId)
                                    .to.be.equal(scenario.orderId);
                            });

                            it('should not mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.false;
                            });

                            if (scenario.amountSold) {
                                it('should emit a SoldAtMarket event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(SoldAtMarket));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amountSold)
                                        .to.be.equal(scenario.amountSold);
                                    expect(events[0].amountReceived)
                                        .to.be.equal(scenario.amountReceived);
                                });
                            }

                            if (scenario.amountPlaced) {
                                it('should emit a PlacedSellOrder event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(PlacedSellOrder));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amount)
                                        .to.be.equal(scenario.amountPlaced);
                                    expect(events[0].orderId)
                                        .to.be.equal(scenario.orderId);
                                });

                                it('should create an order for the amount placed', async (test) => {
                                    const { orderbook, addressBook, operator } = test;
                                    const { price, amountPlaced, actualOrderId } = scenario;
                                    await test.execute();
                                    const order = await orderbook.order(OrderType.SELL, price, actualOrderId);
                                    expect(order.amount)
                                        .to.be.equal(amountPlaced);
                                    expect(await addressBook.addr(order.owner))
                                        .to.be.equal(operator.address);
                                });
                            }

                            it('should take the corresponding tradedToken from operator', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                const { amountSold, amountPlaced } = scenario;
                                const prevBalance = await tradedToken.balanceOf(operator);
                                await test.execute();
                                expect(await tradedToken.balanceOf(operator))
                                    .to.be.equal(prevBalance - (amountSold + amountPlaced) * await orderbook.contractSize());
                            });

                            it('should give the corresponding tradedToken to orderbook', async (test) => {
                                const { tradedToken, orderbook } = test;
                                const { amountSold, amountPlaced } = scenario;
                                const prevBalance = await tradedToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await tradedToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance + (amountSold + amountPlaced) * await orderbook.contractSize());
                            });

                            it('should take the corresponding baseToken from orderbook', async (test) => {
                                const { baseToken, orderbook } = test;
                                const { amountReceived } = scenario;
                                const prevBalance = await baseToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await baseToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance - amountReceived);
                            });

                            it('should give the corresponding baseToken to operator', async (test) => {
                                const { baseToken, operator } = test;
                                const { amountReceived } = scenario;
                                const prevBalance = await baseToken.balanceOf(operator);
                                await test.execute();
                                expect(await baseToken.balanceOf(operator))
                                    .to.be.equal(prevBalance + amountReceived);
                            });

                            it('should leave tradedToken allowance at 0', async (test) => {
                                const { tradedToken, operator, orderbook } = test;
                                await test.execute();
                                expect(await tradedToken.allowance(operator, orderbook))
                                    .to.be.equal(0n);
                            });
                        }
                    });
                }
            });
        }
    });

    describe('claimOrder', () => {
        for (const [ description, scenarios ] of operatorClaimOrderScenarios) {
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

                        } else if (scenario.expectedErrorInResult) {
                            const error = scenario.expectedErrorInResult;

                            it('should mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.true;
                            });

                            it('should return error', async (test) => {
                                expect((await test.executeStatic()).error)
                                    .to.be.equal(error.encode());
                            });

                            it('should emit a Failed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(Failed));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].error)
                                    .to.be.equal(error.encode());
                            });

                            it('should not change claimed amount of the order', async (test) => {
                                const { orderbook } = test;
                                const { orderType, price, orderId } = scenario;
                                const { claimed: prevClaimed } = await orderbook.order(orderType, price, orderId);
                                await test.execute();
                                const { claimed } = await orderbook.order(orderType, price, orderId);
                                expect(claimed)
                                    .to.be.equal(prevClaimed);
                            });

                            it(`should not take ${scenario.givenToken} from orderbook`, async (test) => {
                                const { [scenario.givenToken]: givenToken, orderbook } = test;
                                const prevBalance = await givenToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await givenToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance);
                            });

                        } else {
                            it('should return amount claimed', async (test) => {
                                expect((await test.executeStatic()).amountClaimed)
                                    .to.be.equal(scenario.amountClaimed);
                            });

                            it('should not mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.false;
                            });

                            if (scenario.amountClaimed) {
                                it('should emit a OrderClaimed event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(OrderClaimed));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amount)
                                        .to.be.equal(scenario.amountClaimed);
                                });
                            }

                            if (scenario.deletesOrder) {
                                it('should delete order', async (test) => {
                                    const { orderbook } = test;
                                    const { orderType, price, orderId } = scenario;
                                    await test.execute();
                                    expect((await orderbook.order(orderType, price, orderId)).owner)
                                        .to.be.equal(0n);
                                });

                            } else {
                                it('should update claimed amount of the order', async (test) => {
                                    const { orderbook } = test;
                                    const { orderType, price, orderId, amountClaimed } = scenario;
                                    const { claimed: prevClaimed } = await orderbook.order(orderType, price, orderId);
                                    await test.execute();
                                    const { claimed } = await orderbook.order(orderType, price, orderId);
                                    expect(claimed)
                                        .to.be.equal(prevClaimed + amountClaimed);
                                });
                            }

                            it(`should take the corresponding ${scenario.givenToken} from orderbook`, async (test) => {
                                const { [scenario.givenToken]: givenToken, orderbook } = test;
                                const { givenAmount } = scenario;
                                const prevBalance = await givenToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await givenToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance - givenAmount);
                            });

                            it(`should give the corresponding ${scenario.givenToken} to operator`, async (test) => {
                                const { [scenario.givenToken]: givenToken, operator } = test;
                                const { givenAmount } = scenario;
                                const prevBalance = await givenToken.balanceOf(operator);
                                await test.execute();
                                expect(await givenToken.balanceOf(operator))
                                    .to.be.equal(prevBalance + givenAmount);
                            });
                        }
                    });
                }
            });
        }
    });

    describe('transferOrder', () => {
        for (const [ description, scenarios ] of operatorTransferOrderScenarios) {
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

                        } else if (scenario.expectedErrorInResult) {
                            const error = scenario.expectedErrorInResult;

                            it('should mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.true;
                            });

                            it('should return error', async (test) => {
                                expect((await test.executeStatic()).error)
                                    .to.be.equal(error.encode());
                            });

                            it('should emit a Failed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(Failed));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].error)
                                    .to.be.equal(error.encode());
                            });

                            it('should not change order owner', async (test) => {
                                const { orderType, price, orderId } = scenario;
                                const { orderbook } = test;
                                const { owner: prevOwner } = await orderbook.order(orderType, price, orderId);
                                await test.execute();
                                expect((await orderbook.order(orderType, price, orderId)).owner)
                                    .to.be.equal(prevOwner);
                            });

                        } else {
                            it('should not mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.false;
                            });

                            it('should emit a OrderTransfered event', async (test) => {
                                const events = (await test.execute()).events.filter(is(OrderTransfered));
                                expect(events.length).to.be.equal(1);
                            });

                            it('should update order owner', async (test) => {
                                const { orderType, price, orderId } = scenario;
                                const { orderbook, addressBook } = test;
                                await test.execute();
                                expect(await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner))
                                    .to.be.equal(test[scenario.recipient]);
                            });
                        }
                    });
                }
            });
        }
    });

    describe('cancelOrder', () => {
        for (const [ description, scenarios ] of operatorCancelOrderScenarios) {
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

                        } else if (scenario.expectedErrorInResult) {
                            const error = scenario.expectedErrorInResult;

                            it('should mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.true;
                            });

                            it('should return error', async (test) => {
                                expect((await test.executeStatic()).error)
                                    .to.be.equal(error.encode());
                            });

                            it('should emit a Failed event', async (test) => {
                                const events = (await test.execute()).events.filter(is(Failed));
                                expect(events.length).to.be.equal(1);
                                expect(events[0].error)
                                    .to.be.equal(error.encode());
                            });

                            it('should not change amount of contracts of the order', async (test) => {
                                const { orderbook } = test;
                                const { orderType, price, orderId } = scenario;
                                const { amount: prevAmount } = await orderbook.order(orderType, price, orderId);
                                await test.execute();
                                const { amount } = await orderbook.order(orderType, price, orderId);
                                expect(amount)
                                    .to.be.equal(prevAmount);
                            });

                            it(`should not take ${scenario.givenToken} from orderbook`, async (test) => {
                                const { [scenario.givenToken]: givenToken, orderbook } = test;
                                const prevBalance = await givenToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await givenToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance);
                            });

                        } else {
                            it('should return amount canceled', async (test) => {
                                expect((await test.executeStatic()).amountCanceled)
                                    .to.be.equal(scenario.amountCanceled);
                            });

                            it('should not mark result as failed', async (test) => {
                                expect((await test.executeStatic()).failed)
                                    .to.be.false;
                            });

                            if (scenario.amountCanceled) {
                                it('should emit a OrderClaimed event', async (test) => {
                                    const events = (await test.execute()).events.filter(is(OrderCanceled));
                                    expect(events.length).to.be.equal(1);
                                    expect(events[0].amount)
                                        .to.be.equal(scenario.amountCanceled);
                                });
                            }

                            if (scenario.deletesOrder) {
                                it('should delete order', async (test) => {
                                    const { orderbook } = test;
                                    const { orderType, price, orderId } = scenario;
                                    await test.execute();
                                    expect((await orderbook.order(orderType, price, orderId)).owner)
                                        .to.be.equal(0n);
                                });

                            } else {
                                it('should update amount of contracts of the order', async (test) => {
                                    const { orderbook } = test;
                                    const { orderType, price, orderId, amountCanceled } = scenario;
                                    const { amount: prevAmount } = await orderbook.order(orderType, price, orderId);
                                    await test.execute();
                                    const { amount } = await orderbook.order(orderType, price, orderId);
                                    expect(amount)
                                        .to.be.equal(prevAmount - amountCanceled);
                                });
                            }

                            it(`should take the corresponding ${scenario.givenToken} from orderbook`, async (test) => {
                                const { [scenario.givenToken]: givenToken, orderbook } = test;
                                const { givenAmount } = scenario;
                                const prevBalance = await givenToken.balanceOf(orderbook);
                                await test.execute();
                                expect(await givenToken.balanceOf(orderbook))
                                    .to.be.equal(prevBalance - givenAmount);
                            });

                            it(`should give the corresponding ${scenario.givenToken} to operator`, async (test) => {
                                const { [scenario.givenToken]: givenToken, operator } = test;
                                const { givenAmount } = scenario;
                                const prevBalance = await givenToken.balanceOf(operator);
                                await test.execute();
                                expect(await givenToken.balanceOf(operator))
                                    .to.be.equal(prevBalance + givenAmount);
                            });
                        }
                    });
                }
            });
        }
    });
});
