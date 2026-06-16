FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Extract resolver from /etc/resolv.conf and start nginx
CMD NAMESERVERS=$(awk '$1=="nameserver" {if ($2 ~ /:/) printf "[%s] ", $2; else printf "%s ", $2}' /etc/resolv.conf) && echo "resolver $NAMESERVERS valid=10s ipv6=off;" > /etc/nginx/conf.d/resolver.conf && nginx -g 'daemon off;'
