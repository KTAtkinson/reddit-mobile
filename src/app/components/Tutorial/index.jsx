import './styles.less';

import React from 'react';

import { Anchor } from 'platform/components';

import config from 'config';
const { assetPath } = config;

class Tutorial extends React.Component {
  render() {
    return (
      <div className='Tutorial'>
        <div className='Tutorial__row'>
          <img className='Tutorial__rowImg' src={ `${assetPath}/img/tutorial-post.png` } />
          <span className='Tutorial__rowText'>Welcome! Reddit is home to many communities, called subreddits, dedicated to every topic imaginable</span>
        </div>
        <div className='Tutorial__row'>
          <img className='Tutorial__rowImg' src={ `${assetPath}/img/tutorial-vote.png` } />
          <span className='Tutorial__rowText'>Vote on posts and help communities lift the best content to the top</span>
        </div>
        <div className='Tutorial__row'>
          <img className='Tutorial__rowImg' src={ `${assetPath}/img/tutorial-discuss.png` } />
          <span className='Tutorial__rowText'>Subscribe to communities to fill up this empty screen with fresh posts</span>
        </div>
        <Anchor className='Tutorial__button' href='/r/popular'>Explore popular communities</Anchor>
      </div>
    );
  }
}

export default Tutorial;
