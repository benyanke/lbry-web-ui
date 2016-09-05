var NewAddressSection = React.createClass({
  generateAddress: function() {
    lbry.getNewAddress((results) => {
      this.setState({
        address: results,
      })
    });
  },
  getInitialState: function() {
    return {
      address: "",
    }
  },
  render: function() {
    return (
      <section className="card">
        <h3>Generate New Address</h3>
        <div className="form-row"><input type="text" size="60" value={this.state.address}></input></div>
        <div className="form-row form-row-submit"><Link button="primary" label="Generate" onClick={this.generateAddress} /></div>
      </section>
    );
  }
});

var SendToAddressSection = React.createClass({
  sendToAddress: function() {
    if ((this.state.balance - this.state.amount) < 1)
    {
      alert("Insufficient balance: after this transaction you would have less than 1 LBC in your wallet.")
      return;
    }

    this.setState({
      results: "",
    });

    lbry.sendToAddress(this.state.amount, this.state.address, (results) => {
      if(results === true)
      {
        this.setState({
          results: "Your transaction was successfully placed in the queue.",
        });
      }
      else
      {
        this.setState({
          results: "Something went wrong: " + results
        });
      }
    }, (error) => {
      this.setState({
        results: "Something went wrong: " + error.faultString + " " + error.faultCode
      })
    });
  },
  getInitialState: function() {
    return {
      address: "",
      amount: 0.0,
      balance: <BusyMessage message="Checking balance" />,
      results: "",
    }
  },
  componentWillMount: function() {
    lbry.getBalance((results) => {
      this.setState({
        balance: results,
      });
    });
  },
  setAmount: function(event) {
    this.setState({
      amount: parseFloat(event.target.value),
    })
  },
  setAddress: function(event) {
    this.setState({
      address: event.target.value,
    })
  },
  render: function() {
    return (
      <section className="card">
        <h3>Send Credits</h3>
        <div className="form-row">
          <label htmlFor="amount">Amount</label>
          <input id="amount" type="text" size="10" onChange={this.setAmount}></input>
        </div>
        <div className="form-row">
          <label htmlFor="address">Recipient address</label>
          <input id="address" type="text" size="60" onChange={this.setAddress}></input>
        </div>
        <div className="form-row form-row-submit">
          <Link button="primary" label="Send" onClick={this.sendToAddress} disabled={!(parseFloat(this.state.amount) > 0.0) || this.state.address == ""} />
        </div>
        {
          this.state.results ?
          <div className="form-row">
            <h4>Results</h4>
            {this.state.results}
          </div>
            : ''
        }
      </section>
    );
  }
});


var TransactionList = React.createClass({
  getInitialState: function() {
    return {
      transactionItems: null,
    }
  },
  componentWillMount: function() {
    lbry.call('get_transaction_history', {}, (results) => {
      if (results.length == 0) {
        this.setState({ transactionItems: [] })
      } else {
        var transactionItems = [],
            condensedTransactions = {};
        results.forEach(function(tx) {
          var txid = tx["txid"];
          if (!(txid in condensedTransactions)) {
            condensedTransactions[txid] = 0;
          }
          condensedTransactions[txid] += parseFloat(tx["value"]);
        });
        results.reverse().forEach(function(tx) {
          var txid = tx["txid"];
          if (condensedTransactions[txid] && condensedTransactions[txid] != 0)
          {
            transactionItems.push({
              id: txid,
              date: new Date(parseInt(tx["time"]) * 1000),
              amount: condensedTransactions[txid]
            });
            delete condensedTransactions[txid];
          }
        });

        this.setState({ transactionItems: transactionItems });
      }
    });
  },
  render: function() {
    var rows = [];
    if (this.state.transactionItems && this.state.transactionItems.length > 0)
    {
      this.state.transactionItems.forEach(function(item) {
        rows.push(
          <tr key={item.id}>
            <td>{ (item.amount > 0 ? '+' : '' ) + item.amount }</td>
            <td>{ item.date.toLocaleDateString() }</td>
            <td>{ item.date.toLocaleTimeString() }</td>
            <td>
              <a className="button-text" href={"https://explorer.lbry.io/tx/"+item.id} target="_blank">{item.id.substr(0, 7)}</a>
            </td>
          </tr>
        );
      });
    }
    return (
      <section className="card">
        <h3>Transaction History</h3>
        { this.state.transactionItems === null ? <BusyMessage message="Loading transactions" /> : '' }
        { this.state.transactionItems && rows.length === 0 ? <div className="empty">You have no transactions.</div> : '' }
        { this.state.transactionItems && rows.length > 0 ?
          <table className="table-standard table-stretch">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Date</th>
                <th>Time</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
            : ''
        }
      </section>
    );
  }
});


var WalletPage = React.createClass({
  propTypes: {
    viewingPage: React.PropTypes.string,
  },
  componentDidMount: function() {
    document.title = "My Wallet";
  },
  /*
   Below should be refactored so that balance is shared all of wallet page. Or even broader?
   What is the proper React pattern for sharing a global state like balance?
   */
  getInitialState: function() {
    return {
      balance: null,
    }
  },
  componentWillMount: function() {
    lbry.getBalance((results) => {
      this.setState({
        balance: results,
      })
    });
  },
  render: function() {
    return (
      <main className="page">
        <section className="card">
          <h3>Balance</h3>
          { this.state.balance === null ? <BusyMessage message="Checking balance" /> : ''}
          { this.state.balance !== null ? <CreditAmount amount={this.state.balance} precision={8} /> : '' }
        </section>
        { this.props.viewingPage === 'wallet' ? <TransactionList /> : '' }
        { this.props.viewingPage === 'send' ? <SendToAddressSection /> : '' }
        { this.props.viewingPage === 'receive' ? <NewAddressSection /> : '' }
      </main>
    );
  }
});
