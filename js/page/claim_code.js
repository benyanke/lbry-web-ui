var claimCodeContentStyle = {
  display: 'inline-block',
  textAlign: 'left',
  width: '600px',
}, claimCodeLabelStyle = {
  display: 'inline-block',
  cursor: 'default',
  width: '130px',
  textAlign: 'right',
  marginRight: '6px',
};

var ClaimCodePage = React.createClass({
  getInitialState: function() {
    return {
      submitting: false,
      modal: null,
      referralCredits: null,
      activationCredits: null,
      failureReason: null,
    }
  },
  handleSubmit: function(event) {
    if (typeof event !== 'undefined') {
      event.preventDefault();
    }

    if (!this.refs.code.value) {
      this.setState({
        modal: 'missingCode',
      });
      return;
    } else if (!this.refs.email.value) {
      this.setState({
        modal: 'missingEmail',
      });
      return;
    }

    this.setState({
      submitting: true,
    });

    lbry.getNewAddress((address) => {
      var code = this.refs.code.value;
      var email = this.refs.email.value;

      var xhr = new XMLHttpRequest;
      xhr.addEventListener('load', () => {
        var response = JSON.parse(xhr.responseText);

        if (response.success) {
          this.setState({
            modal: 'codeRedeemed',
            referralCredits: response.referralCredits,
            activationCredits: response.activationCredits,
          });
        } else {
          this.setState({
            submitting: false,
            modal: 'codeRedeemFailed',
            failureReason: response.reason,
          });
        }
      });

      xhr.addEventListener('error', () => {
        this.setState({
          submitting: false,
          modal: 'couldNotConnect',
        });
      });

      xhr.open('POST', 'https://invites.lbry.io', true);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.send('code=' + encodeURIComponent(code) + '&address=' + encodeURIComponent(address) +
               '&email=' + encodeURIComponent(email));
    });
  },
  handleSkip: function() {
    this.setState({
      modal: 'skipped',
    });
  },
  handleFinished: function() {
    localStorage.setItem('claimCodeDone', true);
    window.location = '?home';
  },
  closeModal: function() {
    this.setState({
      modal: null,
    });
  },
  render: function() {
    return (
      <main>
        <form onSubmit={this.handleSubmit}>
          <div className="card">
            <h2>Claim your beta invitation code</h2>
            <section style={claimCodeContentStyle}>
              <p>Thanks for beta testing LBRY! Enter your invitation code and email address below to receive your initial
                 LBRY credits.</p>
              <p>You will be added to our mailing list (if you're not already on it) and will be eligible for future rewards for beta testers.</p>
            </section>
            <section>
              <section><label style={claimCodeLabelStyle} htmlFor="code">Invitation code</label><input name="code" ref="code" /></section>
              <section><label style={claimCodeLabelStyle} htmlFor="email">Email</label><input name="email" ref="email" /></section>
            </section>
            <section>
              <Link button="primary" label={this.state.submitting ? "Submitting..." : "Submit"}
                    disabled={this.state.submitting} onClick={this.handleSubmit} />
              <Link button="alt" label="Skip" disabled={this.state.submitting} onClick={this.handleSkip} />
              <input type='submit' className='hidden' />
            </section>
          </div>
        </form>
        <Modal isOpen={this.state.modal == 'missingCode'} onConfirmed={this.closeModal}>
          Please enter an invitation code or choose "Skip."
        </Modal>
        <Modal isOpen={this.state.modal == 'missingEmail'} onConfirmed={this.closeModal}>
          Please enter an email address or choose "Skip."
        </Modal>
        <Modal isOpen={this.state.modal == 'codeRedeemFailed'} onConfirmed={this.closeModal}>
          {this.state.failureReason}
        </Modal>
        <Modal isOpen={this.state.modal == 'codeRedeemed'} onConfirmed={this.handleFinished}>
          Your invite code has been redeemed.
          {this.state.referralCredits > 0
            ? `You have also earned {referralCredits} credits from referrals. A total of {activationCredits + referralCredits}
                    will be added to your balance shortly.`
            : (this.state.activationCredits > 0
                ? `{this.state.activationCredits} credits will be added to your balance shortly.`
                : 'The credits will be added to your balance shortly.')}
        </Modal>
        <Modal isOpen={this.state.modal == 'skipped'} onConfirmed={this.handleFinished}>
          Welcome to LBRY! You can visit the Wallet page to redeem an invite code at any time.
        </Modal>
        <Modal isOpen={this.state.modal == 'couldNotConnect'} onConfirmed={this.closeModal}>
          <p>LBRY couldn't connect to our servers to confirm your invitation code. Please check your internet connection.</p>
          If you continue to have problems, you can still browse LBRY and visit the Settings page to redeem your code later.
        </Modal>
      </main>
    );
  }
});
