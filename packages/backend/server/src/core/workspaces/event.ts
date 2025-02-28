import { Injectable } from '@nestjs/common';

import { OnEvent } from '../../base';
import { Models } from '../../models';
import { WorkspaceService } from './resolvers/service';

@Injectable()
export class WorkspaceEvents {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly models: Models
  ) {}

  @OnEvent('workspace.members.reviewRequested')
  async onReviewRequested({
    inviteId,
  }: Events['workspace.members.reviewRequested']) {
    // send review request mail to owner and admin
    await this.workspaceService.sendReviewRequestedEmail(inviteId);
  }

  @OnEvent('workspace.members.requestApproved')
  async onApproveRequest({
    inviteId,
  }: Events['workspace.members.requestApproved']) {
    // send approve mail
    await this.workspaceService.sendReviewApproveEmail(inviteId);
  }

  @OnEvent('workspace.members.requestDeclined')
  async onDeclineRequest({
    userId,
    workspaceId,
  }: Events['workspace.members.requestDeclined']) {
    const user = await this.models.user.getPublicUser(userId);
    // send decline mail
    await this.workspaceService.sendReviewDeclinedEmail(
      user?.email,
      workspaceId
    );
  }

  @OnEvent('workspace.members.roleChanged')
  async onRoleChanged({
    userId,
    workspaceId,
    permission,
  }: Events['workspace.members.roleChanged']) {
    // send role changed mail
    await this.workspaceService.sendRoleChangedEmail(userId, {
      id: workspaceId,
      role: permission,
    });
  }

  @OnEvent('workspace.members.ownershipTransferred')
  async onOwnerTransferred({
    workspaceId,
    from,
    to,
  }: Events['workspace.members.ownershipTransferred']) {
    // send ownership transferred mail
    const fromUser = await this.models.user.getPublicUser(from);
    const toUser = await this.models.user.getPublicUser(to);

    if (fromUser) {
      await this.workspaceService.sendOwnershipTransferredEmail(
        fromUser.email,
        {
          id: workspaceId,
        }
      );
    }

    if (toUser) {
      await this.workspaceService.sendOwnershipReceivedEmail(toUser.email, {
        id: workspaceId,
      });
    }
  }
}
