  isNewChatModalOpen = signal(false);
  availableChecklists = signal<any[]>([]);
  isLoadingChecklists = signal(false);

  openNewChatModal() {
    this.isNewChatModalOpen.set(true);
    this.isLoadingChecklists.set(true);
    this.api.get<any>('checklists').subscribe({
      next: (res) => {
        if (res.checklists) {
          const active = res.checklists.filter((c: any) => c.status !== 'completed' && c.status !== 'rejected');
          this.availableChecklists.set(active);
        }
        this.isLoadingChecklists.set(false);
      },
      error: (err) => {
        console.error('Error fetching checklists:', err);
        this.isLoadingChecklists.set(false);
      }
    });
  }

  closeNewChatModal() {
    this.isNewChatModalOpen.set(false);
  }

  startNewChat(checklist: any) {
    this.closeNewChatModal();
    const clientId = checklist.client_id?._id;
    if (!clientId) return;

    let group = this.groupedConversations().find(g => g.client._id === clientId);
    let conv: any = null;

    if (group) {
      conv = group.chats.find(c => c.checklist?._id === checklist._id);
    } else {
      group = {
        client: checklist.client_id,
        chats: [],
        totalUnreadCount: 0
      };
      this.groupedConversations.update(groups => [...groups, group!]);
    }

    if (!conv) {
      conv = {
        checklist: checklist,
        lastMessage: {
          content: 'Start a conversation...',
          createdAt: new Date().toISOString(),
          isPlaceholder: true
        },
        unreadCount: 0
      };
      // We must map because signal array mutation requires creating a new array
      this.groupedConversations.update(groups => groups.map(g => {
        if (g.client._id === clientId) {
          return { ...g, chats: [...g.chats, conv] };
        }
        return g;
      }));
      // Wait, we need to update the group reference to the one we just mapped
      group = this.groupedConversations().find(g => g.client._id === clientId);
    }

    this.filterConversations(this.searchQuery());
    this.selectGroup(group!, conv);
  }
