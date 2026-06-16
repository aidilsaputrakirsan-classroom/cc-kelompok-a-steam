FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Extract resolver from /etc/resolv.conf and start nginx
CMD ["/bin/sh", "-c", "echo \"resolver $(awk 'BEGIN{ORS=\" \"} $1==\"nameserver\" {print $2}' /etc/resolv.conf) valid=10s ipv6=off;\" > /etc/nginx/conf.d/resolver.conf && nginx -g 'daemon off;'"]
