// @flow
import * as ICONS from 'constants/icons';
import * as REACTION_TYPES from 'constants/reactions';
import React from 'react';
import classnames from 'classnames';
import Button from 'component/button';
import usePersistedState from 'effects/use-persisted-state';
import ChannelThumbnail from 'component/channelThumbnail';

type Props = {
  myReacts: Array<string>,
  othersReacts: any,
  react: (string, string) => void,
  commentId: string,
  pendingCommentReacts: Array<string>,
  claimIsMine: boolean,
  activeChannel: string,
};

export default function CommentReactions(props: Props) {
  const { myReacts, othersReacts, commentId, react, claimIsMine, claim, activeChannel } = props;
  console.log('active', activeChannel);

  console.log('claim', claim);
  const authorUri = claim && claim.value_type === 'channel' ? claim.canonical_url : '';

  const getCountForReact = type => {
    let count = 0;
    if (othersReacts && othersReacts[type]) {
      count += othersReacts[type];
    }
    if (myReacts && myReacts.includes(type)) {
      count += 1;
    }
    return count;
  };

  return (
    <>
      <Button
        requiresAuth={IS_WEB}
        title={__('Upvote')}
        icon={ICONS.UPVOTE}
        className={classnames('comment__action', {
          'comment__action--active': myReacts && myReacts.includes(REACTION_TYPES.LIKE),
        })}
        disabled={!activeChannel}
        onClick={() => react(commentId, REACTION_TYPES.LIKE)}
        label={<span className="comment__reaction-count">{getCountForReact(REACTION_TYPES.LIKE)}</span>}
      />
      <Button
        requiresAuth={IS_WEB}
        title={__('Downvote')}
        icon={ICONS.DOWNVOTE}
        className={classnames('comment__action', {
          'comment__action--active': myReacts && myReacts.includes(REACTION_TYPES.DISLIKE),
        })}
        disabled={!activeChannel}
        onClick={() => react(commentId, REACTION_TYPES.DISLIKE)}
        label={<span className="comment__reaction-count">{getCountForReact(REACTION_TYPES.DISLIKE)}</span>}
      />
      {claimIsMine && (
        <Button
          iconOnly
          requiresAuth={IS_WEB}
          title={__('Creator love')}
          icon={ICONS.SUBSCRIBE}
          className={classnames('comment__action', {
            'comment__action--active': myReacts && myReacts.includes(REACTION_TYPES.CREATOR_LIKE),
          })}
          disabled={!activeChannel}
          onClick={() => react(commentId, REACTION_TYPES.CREATOR_LIKE)}
        />
      )}
      {getCountForReact(REACTION_TYPES.CREATOR_LIKE) > 0 && (
        <ChannelThumbnail uri={authorUri} className="comment__creator-like" />
      )}
    </>
  );
}
