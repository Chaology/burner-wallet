import React from 'react';

import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Gnosis from '@frontier-token-research/pm-js/'
import Ruler from "./Ruler";


const YES = 0;
const NO = 1;

const baseDomain = "https://burner-api.helena.network/";
const timeInterval = 4500;
const timeTimeOut = 300;

let interval = false

export default class YourModule extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      odds: [50, 50],
      outcomeTokensSold:[0, 0],
      title: "",
      amount : 0,
    }
  }
  componentDidMount() {
    interval = setInterval(this.pollInterval.bind(this), timeInterval)
    setTimeout(this.pollInterval.bind(this), timeTimeOut)

    this.setState({
      MarketContract: this.props.contractLoader("Market",this.props.marketAddress)
    },()=>{
      console.log("YOURCONTRACT IS LOADED:",this.state.YourContract)
    })

    this.firstApprove();

  }
  componentWillUnmount() {
    clearInterval(interval)
  }

  async pollInterval(){
      const marketInfo = await this.getMarketInfo(this.props.marketAddress)
      if(marketInfo&&marketInfo.event){
        const outcomeTokensSold = marketInfo.netOutcomeTokensSold
        const title = marketInfo.event.oracle.eventDescription.title
        const odds = marketInfo.marginalPrices;
        this.setState({/*marketAddress, */odds, outcomeTokensSold, title})
      }

  }

  async getMarketInfo(address) {
      const response = await fetch(baseDomain +`/api/markets/${address}/`)
      const json = await response.json();
      return json;
  }

  async firstApprove() {
    const allowance = await this.props.contracts.ERC20Vendable.allowance(this.props.address, this.props.contracts.Market._address).call();
    console.log(allowance)
    if(allowance === 0) {
      this.props.tx(
        this.props.contracts.ERC20Vendable.approve(this.props.contracts.Market._address, -1),
        50000, 0, 0,(approveReceipt)=>{
      });
    }
    return true;
  }

  bet(outcome) {
      const cost = Gnosis.calcLMSROutcomeTokenCount(
          this.state.outcomeTokensSold,
          1000e18,
          outcome,
          this.state.amount * 1e18,
          0
      );
      this.props.changeView('loader')
      this.props.tx(

        this.props.contracts.ERC20Vendable.approve(this.props.marketAddress, -1),
        50000, 0, 0,(approveReceipt)=>{
          this.props.tx(
            this.state.MarketContract.buy(outcome, cost.toNumber(), 10 * 1e18),
            1042570, 0, 0,(buyReceipt)=>{
              if(buyReceipt){
                console.log("BET COMPLETE?!?", buyReceipt)
                this.props.changeView('yourmodule')
              }
            }
          )
        }
      );
  }


  render(){
    if(!this.state.title){
      return (<div>loading market...</div>)
    }
    return (
      <div>
        <div className="form-group w-100">
          <div className="content bridge row">
            <div className="col-12 p-1">
            <div style={{paddingTop:20,textAlign:'center',fontSize:22}}>
              {this.state.title}
            </div>
            </div>
          </div>

          <div className="content row">
            <div className="input-group">
              <input type="text" className="form-control" placeholder="xP+ amount you want to bet" value={this.state.value}
                onChange={event => this.setState({'amount': event.target.value})}
              />
            </div>
          </div>

          <div className="content bridge row">
            <div className="col-6 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={() => {
                this.bet(YES)}
              }>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-check"></i> {"YES (" + Math.round(this.state.odds[0] * 100 *1000)/1000 + "%)"}
                </Scaler>
              </button>
            </div>
            <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                this.bet(NO)}
            }>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-times"></i> {"NO (" + Math.round(this.state.odds[1] * 100 *1000)/1000 + "%)"}
              </Scaler>
            </button>
            </div>
          </div>

        </div>
      </div>
    )
  }
}
