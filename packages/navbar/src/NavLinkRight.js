import React, { PureComponent } from 'react'

import { withRouter } from 'react-router'
import { NavLink } from 'react-router-dom'

import NavLinkContent from './NavLinkContent'
import NavDropdown from './NavDropdown'

class NavLinkRight extends PureComponent {
  static defaultProps = {
    onClickItem: () => {},
  }

  onClickItem = item => {
    const { route, history } = this.props
    this.props.onClickItem(item.id)
    if (history.location.pathname.startsWith(`/${route}`)) {
      history.push(`/${route}/${item.id}`)
    }
  }

  render () {
    const { route, title, selected, dropdown, icon } = this.props

    return (
      <NavLink
        to={`/${route}/${selected.id || ''}`}
        className='nav-link d-flex p-0'
        activeClassName='active'
      >
        <NavLinkContent
          title={title}
          selected={selected.name}
          icon={icon}
          width='5.9rem'
        />
        <NavDropdown
          right
          route={route}
          selected={selected.id || ''}
          list={dropdown}
          onClickItem={this.onClickItem}
          icon={icon}
        />
      </NavLink>
    )
  }
}

export default withRouter(NavLinkRight)
