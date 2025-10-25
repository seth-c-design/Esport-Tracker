
export const canRequestNotifications = (): boolean => {
  return 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!canRequestNotifications()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!canRequestNotifications()) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title: string, options: NotificationOptions) => {
  if (getNotificationPermission() === 'granted') {
    new Notification(title, options);
  } else {
    console.log("Notification permission not granted.");
  }
};
