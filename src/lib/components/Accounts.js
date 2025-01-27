import browser from '../browser-api'
import Logger from '../Logger'
import picostyle from 'picostyle'
import { h } from 'hyperapp'
import Account from '../Account'
import * as Basics from './basics'
const FLOCCUS_VERSION = require('../../../package.json').version

const style = picostyle(h)

const {
  H1,
  Button,
  InputGroup,
  Select,
  Option,
  Label,
  P,
  Account: AccountEl
} = Basics

export const state = {
  accounts: {
    accounts: {},
    secured: false,
    creationType: 'nextcloud-folders'
  }
}

export const actions = {
  accounts: {
    setList: accounts => ({
      accounts
    }),
    setSecured: secured => ({ secured }),
    load: () => async (state, actions) => {
      const accountsArray = await Account.getAllAccounts()
      const accounts = {}
      accountsArray.forEach(acc => {
        accounts[acc.id] = acc
      })

      const { accountsLocked } = await browser.storage.local.get({
        accountsLocked: null
      })
      actions.setSecured(accountsLocked)
      actions.setList(accounts)
    },
    sync: accountId => async (state, actions) => {
      const background = await browser.runtime.getBackgroundPage()
      background.syncAccount(accountId)
    },
    setCreationType: type => ({ creationType: type })
  },
  createAccount: () => async (state, actions) => {
    let account = await Account.create(
      Account.getDefaultValues(state.accounts.creationType)
    )
    await actions.accounts.load()
    await actions.openOptions(account.id)
  },
  downloadLogs: async () => {
    await Logger.downloadLogs()
  }
}

export const Component = () => (state, actions) => {
  return (
    <AccountsStyle>
      <div id="accounts">
        {Object.keys(state.accounts.accounts).map(accountId => (
          <AccountEl account={state.accounts.accounts[accountId]} />
        ))}
      </div>
      <div class="wrapper">
        <InputGroup fullWidth={true}>
          <Select
            style={{ width: '75%' }}
            onchange={e => {
              actions.accounts.setCreationType(e.currentTarget.value)
            }}
          >
            <option value="nextcloud-folders">
              {browser.i18n.getMessage('LabelAdapternextcloudfolders')}
            </option>
            <option value="nextcloud">
              {browser.i18n.getMessage('LabelAdapternextcloud')}
            </option>
            <option value="webdav">
              {browser.i18n.getMessage('LabelAdapterwebdav')}
            </option>
          </Select>
          <Button
            primary
            onclick={e => {
              actions.createAccount()
            }}
          >
            {browser.i18n.getMessage('LabelAddaccount')}
          </Button>
        </InputGroup>
        <P>
          {state.accounts.creationType === 'nextcloud-folders'
            ? browser.i18n.getMessage('DescriptionAdapternextcloudfolders')
            : state.accounts.creationType === 'nextcloud'
            ? browser.i18n.getMessage('DescriptionAdapternextcloud')
            : browser.i18n.getMessage('DescriptionAdapterwebdav')}
        </P>
        <p> </p>
        <div class="security">
          <Label>
            <input
              type="checkbox"
              checked={state.accounts.secured}
              onclick={e => {
                if (e.currentTarget.checked) {
                  actions.switchView('setupKey')
                } else {
                  actions.unsetKey()
                }
              }}
            />{' '}
            {browser.i18n.getMessage('LabelSecurecredentials')}
          </Label>
        </div>
        <div class="footer">
          <div class="debugging-tools">
            <a href="options.html" target="_blank">
              {browser.i18n.getMessage('LabelOpenintab')}
            </a>
            <a
              href="#"
              onclick={e => {
                actions.downloadLogs()
                e.preventDefault()
              }}
            >
              {browser.i18n.getMessage('LabelDebuglogs')}
            </a>
            <a
              target="_blank"
              href="https://github.com/marcelklehr/floccus#donate"
            >
              {browser.i18n.getMessage('LabelFunddevelopment')}
            </a>
          </div>
          <div class="branding">
            <a href="https://github.com/marcelklehr/floccus" target="_blank">
              <img src="../../icons/logo.svg" border="0" /> floccus
            </a>
          </div>
        </div>
      </div>
    </AccountsStyle>
  )
}

const AccountsStyle = style('div')({
  ' .footer': {
    fontSize: '11px',
    paddingTop: '30px',
    marginBottom: '-20px',
    overflow: 'auto'
  },
  ' .footer a': {
    color: '#3893cc !important',
    textDecoration: 'none'
  },
  ' .footer a:hover': {
    textDecoration: 'underline'
  },
  ' .debugging-tools': {
    float: 'right'
  },
  ' .debugging-tools a': {
    display: 'inline-block',
    marginLeft: '10px'
  },
  ' .branding': {
    float: 'left'
  },
  ' .branding a': {
    textDecoration: 'none !important'
  },
  ' .branding img': {
    width: 'auto',
    height: '3em',
    position: 'relative',
    verticalAlign: 'top',
    top: '-1em'
  },
  ' .wrapper': {
    position: 'relative',
    background: 'white',
    margin: '0',
    padding: '10px 20px 20px 25px' // top is actually 25px as well, because of InputGroup
  }
})
